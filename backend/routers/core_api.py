import os
import json
import random
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from werkzeug.security import generate_password_hash, check_password_hash

from database_fastapi import get_db
from models_fastapi import User, Complaint, Project, Notification, Vendor

router = APIRouter(prefix="/api", tags=["core"])

VENDOR_DEFAULT_SPEC = os.getenv('VENDOR_DEFAULT_SPECIALIZATION', 'Infrastructure')
VENDOR_AUTO_VERIFY = os.getenv('VENDOR_AUTO_VERIFY', 'true').lower() == 'true'
VENDOR_SUPPORT_EMAIL = os.getenv('VENDOR_SUPPORT_EMAIL', 'vendor-support@smartgov.in')


# --- VENDOR SCHEMAS & ROUTES ---
class VendorRegisterReq(BaseModel):
    company_name: str
    contact_person: str
    email: str
    mobile: str
    password: str
    gst_number: Optional[str] = ""
    pan_number: Optional[str] = ""
    specialization: Optional[str] = VENDOR_DEFAULT_SPEC
    experience: Optional[str] = ""

class VendorLoginReq(BaseModel):
    username: str
    password: str

@router.post("/vendor/register")
def vendor_register(req: VendorRegisterReq, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    existing = db.query(Vendor).filter((Vendor.email == email) | (Vendor.company_name == req.company_name.strip())).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vendor with email or company already exists.")
    
    vendor_id = f"VND-{random.randint(1000, 9999)}"
    new_vendor = Vendor(
        vendor_id=vendor_id,
        company_name=req.company_name.strip(),
        contact_person=req.contact_person.strip(),
        email=email,
        mobile=req.mobile.strip(),
        password_hash=generate_password_hash(req.password),
        gst_number=req.gst_number,
        pan_number=req.pan_number,
        specialization=req.specialization,
        experience=req.experience,
        is_verified=VENDOR_AUTO_VERIFY
    )
    db.add(new_vendor)
    db.commit()
    return {"success": True, "vendor": new_vendor.to_dict(), "support_email": VENDOR_SUPPORT_EMAIL}

@router.post("/vendor/login")
def vendor_login(req: VendorLoginReq, db: Session = Depends(get_db)):
    username = req.username.strip().lower()
    vendor = db.query(Vendor).filter((Vendor.email == username) | (Vendor.vendor_id == username.upper())).first()
    if not vendor or not check_password_hash(vendor.password_hash, req.password):
        raise HTTPException(status_code=401, detail="Invalid Vendor credentials.")
    return {"success": True, "vendor": vendor.to_dict(), "support_email": VENDOR_SUPPORT_EMAIL}

# --- DASHBOARD ---
@router.get("/dashboard/{user_id}")
def get_dashboard(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).get(user_id)
    if not user:
        user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_complaints = db.query(Complaint).filter_by(user_id=user.id).order_by(Complaint.id.desc()).all()
    projects = db.query(Project).all()
    
    under_review = sum(1 for c in user_complaints if c.status == 'Under Review')
    resolved = sum(1 for c in user_complaints if c.status == 'Resolved')
    notifs = db.query(Notification).filter_by(user_id=user.id).order_by(Notification.id.desc()).all()
    
    return {
        "success": True,
        "user": user.to_dict(),
        "stats": {
            "total_complaints": len(user_complaints),
            "under_review": under_review,
            "resolved": resolved,
            "total_projects": len(projects)
        },
        "complaints": [c.to_dict() for c in user_complaints],
        "projects": [p.to_dict() for p in projects],
        "notifications": [n.to_dict() for n in notifs]
    }

# --- COMPLAINTS ---
class ComplaintSubmitReq(BaseModel):
    user_id: int
    title: str
    category: str = "Road"
    description: str = ""
    urgency: str = "Medium"
    location: str = "Kothrud, Pune"
    images: List[str] = []

@router.post("/complaints")
def submit_complaint(req: ComplaintSubmitReq, db: Session = Depends(get_db)):
    count = db.query(Complaint).count() + 102
    ticket_number = f"#C-2024-{count}"
    now_str = datetime.utcnow().strftime('%d %b %Y, %I:%M %p')
    default_timeline = [
        {"title": "Submitted", "time": now_str, "status": "completed", "note": "Complaint logged into system."},
        {"title": "Under Review", "time": "Just Now", "status": "active", "note": "Being reviewed."},
        {"title": "Demand Aggregated", "time": "Pending", "status": "pending"}
    ]
    
    new_c = Complaint(
        user_id=req.user_id, ticket_number=ticket_number, title=req.title,
        category=req.category, description=req.description, urgency=req.urgency,
        location=req.location, images=json.dumps(req.images) if req.images else None,
        status='Under Review', timeline_json=json.dumps(default_timeline)
    )
    notif = Notification(user_id=req.user_id, text=f'Complaint {ticket_number} submitted via FastAPI.')
    db.add(new_c)
    db.add(notif)
    db.commit()
    return {"success": True, "complaint": new_c.to_dict()}

@router.get("/complaints")
def get_complaints(user_id: Optional[int] = None, status: Optional[str] = None, search: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Complaint)
    if user_id: q = q.filter(Complaint.user_id == user_id)
    if status and status != 'All': q = q.filter(Complaint.status == status)
    results = q.order_by(Complaint.id.desc()).all()
    
    if search:
        s = search.lower()
        results = [c for c in results if s in c.title.lower() or s in c.ticket_number.lower() or s in c.category.lower()]
    return {"success": True, "complaints": [c.to_dict() for c in results]}

@router.get("/complaints/{c_id}")
def get_complaint_detail(c_id: int, db: Session = Depends(get_db)):
    c = db.query(Complaint).get(c_id)
    if not c: raise HTTPException(status_code=404, detail="Not found")
    return {"success": True, "complaint": c.to_dict()}

# --- PROJECTS & ISSUES ---
@router.get("/projects")
def get_projects(category: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Project)
    if category and category != 'All':
        q = q.filter(Project.category == category)
    return {"success": True, "projects": [p.to_dict() for p in q.all()]}

@router.get("/projects/{p_id}")
def get_project_detail(p_id: int, db: Session = Depends(get_db)):
    p = db.query(Project).get(p_id)
    if not p: raise HTTPException(status_code=404, detail="Not found")
    return {"success": True, "project": p.to_dict()}

@router.get("/community-issues")
def get_community_issues(location: str = "Kothrud, Pune", db: Session = Depends(get_db)):
    all_c = db.query(Complaint).all()
    return {
        "success": True, "location": location,
        "stats": {"total_issues": len(all_c), "categories": len(set(c.category for c in all_c)), "citizens_involved": len(set(c.user_id for c in all_c))},
        "issues": [c.to_dict() for c in all_c]
    }

# --- CITIZEN ---
@router.get("/citizen/profile")
def get_citizen_profile(user_id: int, db: Session = Depends(get_db)):
    u = db.query(User).get(user_id)
    if not u: raise HTTPException(status_code=404, detail="Not found")
    return {"success": True, "profile": u.to_dict()}

@router.get("/citizen/notifications")
def get_cit_notifs(user_id: int, db: Session = Depends(get_db)):
    n = db.query(Notification).filter_by(user_id=user_id).order_by(Notification.id.desc()).all()
    return {"success": True, "notifications": [x.to_dict() for x in n]}

class MarkNotifReq(BaseModel):
    user_id: int

@router.post("/citizen/notifications/read-all")
def mark_notifs_read(req: MarkNotifReq, db: Session = Depends(get_db)):
    db.query(Notification).filter_by(user_id=req.user_id).update({'is_read': True})
    db.commit()
    return {"success": True}

# --- AI ENDPOINTS ---
class AiTextReq(BaseModel):
    text: str = ""
    title: str = ""
    description: str = ""

@router.post("/ai/complaint-assist")
def ai_assist(req: AiTextReq):
    t = req.text.lower()
    if 'road' in t or 'pothole' in t: sugg = "Damaged road sections causing severe risk."
    elif 'water' in t or 'leak' in t: sugg = "Major water pipeline leakage observed."
    elif 'garbage' in t: sugg = "Solid waste and garbage accumulation causing hazards."
    else: sugg = f"Civic Infrastructure Issue: {req.text}. Requires inspection."
    return {"success": True, "suggestion": sugg}

@router.post("/ai/classify-complaint")
def ai_classify(req: AiTextReq):
    t = f"{req.title} {req.description}".lower()
    if any(k in t for k in ['road', 'pothole']): return {"success": True, "category": "Road", "confidence": 94, "issue": "Road Damage"}
    if any(k in t for k in ['water', 'pipe', 'leak']): return {"success": True, "category": "Water", "confidence": 92, "issue": "Pipeline Leak"}
    if any(k in t for k in ['garbage', 'trash']): return {"success": True, "category": "Garbage", "confidence": 96, "issue": "Solid Waste"}
    return {"success": True, "category": "Other", "confidence": 75, "issue": "General Inquiry"}

class ChatReq(BaseModel):
    query: str
    user_id: Optional[int] = None

@router.post("/chatbot/ask")
def chatbot_ask(req: ChatReq):
    return {"success": True, "answer": "Hello from the FastAPI migrated SmartGov AI Bot! I can assist you dynamically now."}
