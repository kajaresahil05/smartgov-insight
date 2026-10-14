from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from typing import Optional

from database_fastapi import get_db
from models_fastapi import User, EmailOTP
from otp_service import generate_secure_otp, hash_otp, verify_otp_hash, mask_email, send_smtp_email

router = APIRouter(prefix="/api/auth", tags=["auth"])

class SendOTPRequest(BaseModel):
    email: EmailStr
    full_name: Optional[str] = ""
    mobile: Optional[str] = ""
    password: Optional[str] = ""
    is_vendor: Optional[bool] = False

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterLocationReq(BaseModel):
    user_id: int
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class RegisterCompleteReq(BaseModel):
    user_id: int
    dob: str
    language: str

@router.post("/register-location")
def register_location(req: RegisterLocationReq, db: Session = Depends(get_db)):
    user = db.query(User).get(req.user_id)
    if user:
        user.location = req.location
        if req.latitude is not None and (-90.0 <= req.latitude <= 90.0):
            user.preferred_latitude = req.latitude
        if req.longitude is not None and (-180.0 <= req.longitude <= 180.0):
            user.preferred_longitude = req.longitude
        db.commit()
    return {"success": True}

@router.post("/register-complete")
def register_complete(req: RegisterCompleteReq, db: Session = Depends(get_db)):
    user = db.query(User).get(req.user_id)
    if user:
        user.dob = req.dob
        user.language = req.language
        db.commit()
    return {"success": True, "user": user.to_dict() if user else None}

@router.post("/send-email-otp")
def send_email_otp(req: SendOTPRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    now = datetime.utcnow()

    # Rate Limiting
    latest_otp = db.query(EmailOTP).filter(EmailOTP.email == email).order_by(EmailOTP.id.desc()).first()
    if latest_otp and latest_otp.cooldown_until and latest_otp.cooldown_until > now:
        raise HTTPException(status_code=429, detail=f"Please wait before requesting another OTP.")

    user = None
    if not req.is_vendor:
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user and existing_user.email_verified:
            raise HTTPException(status_code=400, detail="An account with this email address already exists. Please log in.")

        # Create unverified user or update existing unverified user
        try:
            user = existing_user
            if not user and req.full_name:
                password_hash = generate_password_hash(req.password) if req.password else ""
                user = User(
                    full_name=req.full_name,
                    email=email,
                    mobile=req.mobile or "",
                    password_hash=password_hash,
                    email_verified=False
                )
                db.add(user)
                db.commit()
            elif user and not user.email_verified:
                # Allow user to update their name, mobile, and password if re-submitting step 1
                if req.full_name:
                    user.full_name = req.full_name
                if req.mobile:
                    user.mobile = req.mobile
                if req.password:
                    user.password_hash = generate_password_hash(req.password)
                db.commit()
        except Exception as e:
            db.rollback()
            err_msg = str(e).lower()
            if "unique constraint" in err_msg or "unique" in err_msg:
                if "mobile" in err_msg:
                    raise HTTPException(status_code=400, detail="This mobile number is already in use by another account.")
                elif "email" in err_msg:
                    raise HTTPException(status_code=400, detail="An account with this email address already exists. Please log in.")
            raise HTTPException(status_code=400, detail=f"Unable to process registration: {str(e)}")

    user_name = req.full_name or (user.full_name if user else 'Vendor Representative')
    plain_otp = generate_secure_otp()
    
    # Send Email (Sync via smtp)
    sent_success, _ = send_smtp_email(email, user_name, plain_otp)
    if not sent_success:
        raise HTTPException(status_code=500, detail="Unable to send OTP.")

    db.query(EmailOTP).filter(EmailOTP.email == email).delete()
    new_otp = EmailOTP(
        email=email,
        otp_hash=hash_otp(plain_otp),
        expires_at=now + timedelta(minutes=5),
        cooldown_until=now + timedelta(seconds=60)
    )
    db.add(new_otp)
    db.commit()

    return {"success": True, "message": "OTP sent successfully", "masked_email": mask_email(email)}


@router.post("/verify-email-otp")
def verify_email_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    now = datetime.utcnow()
    
    otp_record = db.query(EmailOTP).filter(EmailOTP.email == email).order_by(EmailOTP.id.desc()).first()
    if not otp_record or otp_record.attempts >= 5 or otp_record.expires_at < now:
        raise HTTPException(status_code=400, detail="OTP invalid or expired.")

    if not verify_otp_hash(req.otp, otp_record.otp_hash):
        otp_record.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid OTP.")

    user = db.query(User).filter(User.email == email).first()
    if user:
        user.email_verified = True
        user.email_verified_at = now
    
    db.delete(otp_record)
    db.commit()

    return {"success": True, "message": "Email verified successfully", "user": user.to_dict() if user else None}


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    username = req.username.strip().lower()
    user = db.query(User).filter((User.email == username) | (User.mobile == username)).first()

    if not user or not check_password_hash(user.password_hash, req.password):
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    if not user.email_verified:
        raise HTTPException(status_code=403, detail="Please verify your email address.")

    return {"success": True, "user": user.to_dict()}
