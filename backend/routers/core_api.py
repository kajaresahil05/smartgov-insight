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
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_accuracy: Optional[float] = None
    location_source: Optional[str] = "manual"
    parent_complaint_id: Optional[int] = None
    is_duplicate: Optional[bool] = False
    images: List[str] = []

@router.post("/complaints")
def submit_complaint(req: ComplaintSubmitReq, db: Session = Depends(get_db)):
    # Validate coordinate ranges if provided
    if req.latitude is not None and not (-90.0 <= req.latitude <= 90.0):
        raise HTTPException(status_code=400, detail="Latitude must be between -90 and 90 degrees.")
    if req.longitude is not None and not (-180.0 <= req.longitude <= 180.0):
        raise HTTPException(status_code=400, detail="Longitude must be between -180 and 180 degrees.")

    count = db.query(Complaint).count() + 102
    ticket_number = f"#C-2024-{count}"
    now_str = datetime.utcnow().strftime('%d %b %Y, %I:%M %p')
    
    parent_id = req.parent_complaint_id
    is_dup = req.is_duplicate or False
    dup_reason = None
    
    # Check parent complaint if user selected association
    parent_complaint = None
    if parent_id:
        parent_complaint = db.query(Complaint).filter(Complaint.id == parent_id).first()
        if parent_complaint:
            is_dup = True
            parent_complaint.duplicate_count = (parent_complaint.duplicate_count or 0) + 1
            dup_reason = f"Linked to canonical complaint {parent_complaint.ticket_number} by citizen"
            # Append timeline note to parent canonical record
            try:
                p_timeline = json.loads(parent_complaint.timeline_json or '[]')
                p_timeline.append({
                    "title": "Additional Report Linked",
                    "time": now_str,
                    "status": "active",
                    "note": f"Associated report {ticket_number} merged. Total reports: {parent_complaint.duplicate_count + 1}."
                })
                parent_complaint.timeline_json = json.dumps(p_timeline)
            except Exception as e:
                print(f"[TIMELINE UPDATE ERROR] {e}")
    else:
        # Server-side concurrency check: check if an identical complaint at same location was just submitted
        try:
            from duplicate_service import get_duplicate_engine
            engine = get_duplicate_engine()
            recent_complaints = db.query(Complaint).order_by(Complaint.id.desc()).limit(20).all()
            existing_candidates = [
                {
                    "id": c.id,
                    "title": c.title,
                    "description": c.description or "",
                    "latitude": c.latitude,
                    "longitude": c.longitude,
                    "location": c.location,
                    "ticket_number": c.ticket_number,
                    "category": c.category
                }
                for c in recent_complaints
            ]
            
            dup_match = engine.find_duplicate(
                title=req.title,
                description=req.description,
                category=req.category,
                latitude=req.latitude,
                longitude=req.longitude,
                existing_complaints=existing_candidates
            )
            
            if dup_match and dup_match.get("is_duplicate"):
                matched_id = dup_match.get("matched_id")
                matched_c = db.query(Complaint).filter(Complaint.id == matched_id).first()
                if matched_c:
                    is_dup = True
                    parent_id = matched_id
                    matched_c.duplicate_count = (matched_c.duplicate_count or 0) + 1
                    dup_reason = f"Automated spatial-semantic duplicate link to {matched_c.ticket_number} (Similarity: {dup_match.get('similarity_score', 0):.2f})"
        except Exception as dup_err:
            print(f"[CONCURRENT DUP CHECK ERROR] {dup_err}")
            
    default_timeline = [
        {"title": "Submitted", "time": now_str, "status": "completed"},
        {"title": "Under Review", "time": "In Progress", "status": "active"},
        {"title": "Demand Aggregated", "time": "Pending", "status": "pending"}
    ]
    
    new_c = Complaint(
        user_id=req.user_id,
        ticket_number=ticket_number,
        title=req.title,
        category=req.category,
        description=req.description,
        urgency=req.urgency,
        location=req.location,
        latitude=req.latitude,
        longitude=req.longitude,
        location_accuracy=req.location_accuracy,
        location_source=req.location_source or 'manual',
        parent_complaint_id=parent_id,
        is_duplicate=is_dup,
        duplicate_reason=dup_reason,
        duplicate_count=0,
        images=json.dumps(req.images) if req.images else None,
        status='Under Review',
        timeline_json=json.dumps(default_timeline)
    )
    notif = Notification(user_id=req.user_id, text=f'Complaint {ticket_number} submitted via FastAPI.')
    db.add(new_c)
    db.add(notif)
    db.commit()
    db.refresh(new_c)
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
class CitizenProfileUpdateReq(BaseModel):
    user_id: int
    full_name: Optional[str] = None
    mobile: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

@router.get("/citizen/profile")
def get_citizen_profile(user_id: int, db: Session = Depends(get_db)):
    u = db.query(User).get(user_id)
    if not u: raise HTTPException(status_code=404, detail="Not found")
    return {"success": True, "profile": u.to_dict()}

@router.put("/citizen/profile")
def update_citizen_profile(req: CitizenProfileUpdateReq, db: Session = Depends(get_db)):
    u = db.query(User).get(req.user_id)
    if not u: raise HTTPException(status_code=404, detail="Not found")
    if req.full_name is not None: u.full_name = req.full_name
    if req.mobile is not None: u.mobile = req.mobile
    if req.location is not None: u.location = req.location
    if req.latitude is not None and (-90.0 <= req.latitude <= 90.0):
        u.preferred_latitude = req.latitude
    if req.longitude is not None and (-180.0 <= req.longitude <= 180.0):
        u.preferred_longitude = req.longitude
    db.commit()
    db.refresh(u)
    return {"success": True, "message": "Profile updated successfully", "profile": u.to_dict()}

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
    category: str = ""

class UrgencyReq(BaseModel):
    title: str
    description: str
    category: str = ""

# Lazy load AI models
ml_model = None
ml_vectorizer = None
ml_label_mapping = None

urgency_model = None
urgency_tokenizer = None
urgency_label_map = None

def get_ml_model():
    global ml_model, ml_vectorizer, ml_label_mapping
    if ml_model is None:
        try:
            import joblib
            import json
            
            print("Loading ML model from ML_models/...")
            ml_model = joblib.load("ML_models/complaint_classifier.joblib")
            ml_vectorizer = joblib.load("ML_models/tfidf_vectorizer.joblib")
            
            with open("ML_models/label_mapping.json", "r") as f:
                mapping = json.load(f)
                ml_label_mapping = {int(k): v for k, v in mapping["id2label"].items()}
            print("Category Model loaded successfully.")
        except Exception as e:
            print("Failed to load Category model:", e)
    return ml_model, ml_vectorizer, ml_label_mapping

def get_urgency_model():
    global urgency_model, urgency_tokenizer, urgency_label_map
    if urgency_model is None:
        try:
            from transformers import AutoTokenizer, AutoModelForSequenceClassification
            import json
            
            model_path = "./ML_models/complaint_urgency_distilbert"
            print(f"Loading Urgency model from {model_path}...")
            urgency_tokenizer = AutoTokenizer.from_pretrained(model_path)
            urgency_model = AutoModelForSequenceClassification.from_pretrained(model_path)
            urgency_model.eval()
            
            with open(f"{model_path}/label_mapping.json", "r") as f:
                mapping = json.load(f)
                urgency_label_map = {int(k): v for k, v in mapping["id2label"].items()}
            print("Urgency Model loaded successfully.")
        except Exception as e:
            print("Failed to load Urgency model:", e)
    return urgency_model, urgency_tokenizer, urgency_label_map

@router.post("/ai/complaint-assist")
def ai_assist(req: AiTextReq):
    c = req.category.strip().lower()
    t = req.title.strip()
    d = req.text.strip() if req.text.strip() else req.description.strip()
    
    # Clean recursive boilerplate if user clicks AI Polish on previously polished text
    clean_d = d
    for phrase in [
        "The area is experiencing an infrastructure issue:",
        "The following issue has been reported:",
        "A sanitation issue involves:",
        "Street light concern reported:",
        "An electrical supply complication has been detailed as",
        "Resident reported a civic issue regarding",
        "According to the report:",
        "Please investigate the cause and restore normal conditions as soon as possible.",
        "Please inspect the affected section and arrange appropriate repairs as this creates difficulties for vehicles and pedestrians.",
        "This requires prompt clearing to prevent accumulation and maintain hygiene in the locality.",
        "Please investigate and repair this issue, as it reduces visibility and creates safety concerns.",
        "This disruption requires maintenance to restore a safe and reliable power grid.",
        "This matter requires municipal assessment and appropriate intervention."
    ]:
        clean_d = clean_d.replace(phrase, "")
    
    clean_d = clean_d.replace(f"'{t}'", "").replace(f'"{t}"', "").replace("..", ".").strip(" ':.")
    if not clean_d: clean_d = d if d else t
    if not t: t = c if c else "civic issue"
        
    # Context-aware generator matching constraints without LLM availability
    if "road" in c or "pothole" in t.lower() or "road" in t.lower():
        sugg = f"The following issue has been reported: '{t}'. {clean_d.capitalize()}. Please inspect the affected section and arrange appropriate repairs as this creates difficulties for vehicles and pedestrians."
    elif "garbage" in c or "sanitation" in c:
        sugg = f"A sanitation issue involves '{t}'. Specifically: {clean_d}. This requires prompt clearing to prevent accumulation and maintain hygiene in the locality."
    elif "light" in c or "streetlight" in c:
        sugg = f"Street light concern reported: '{t}'. {clean_d.capitalize()}. Please investigate and repair this issue, as it reduces visibility and creates safety concerns."
    elif "water" in c or "drainage" in c:
        sugg = f"The area is experiencing an infrastructure issue: '{t}'. According to the report: {clean_d}. Please investigate the cause and restore normal conditions as soon as possible."
    elif "electric" in c:
        sugg = f"An electrical supply complication has been detailed as '{t}'. {clean_d.capitalize()}. This disruption requires maintenance to restore a safe and reliable power grid."
    else:
        sugg = f"Resident reported a {c if c else 'civic'} issue regarding '{t}'. The detailed observation is: {clean_d}. This matter requires municipal assessment and appropriate intervention."
        
    sugg = sugg.replace("..", ".").replace(" .", ".").strip()
    return {"success": True, "suggestion": sugg}

@router.post("/ai/classify-complaint")
def ai_classify(req: AiTextReq):
    model, vectorizer, label_map = get_ml_model()
    
    if not model or not vectorizer:
        return {"success": True, "category": "Other Civic Issues", "confidence": 50.0, "issue": "Fallback"}

    combined_text = f"Title: {req.title.strip()} Description: {req.description.strip()}"
    print(f"[AI CLASSIFY INPUT] {combined_text}")
    
    try:
        X_vec = vectorizer.transform([combined_text])
        probs = model.predict_proba(X_vec)[0]
        
        all_probs = {label_map[i]: round(float(p) * 100, 2) for i, p in enumerate(probs)}
        sorted_probs = sorted(all_probs.items(), key=lambda x: x[1], reverse=True)
        
        top_category, confidence = sorted_probs[0]
        
        print("-" * 40)
        print(f"\n[AI PREDICTION CLASS] {top_category} ({confidence}%)")
        print("\nAll class probabilities:")
        for cat, prob in all_probs.items():
            print(f"{cat}: {prob}%")
        print("-" * 40)
        
        return {
            "success": True,
            "category": top_category,
            "confidence": confidence,
            "all_probs": all_probs,
            "issue": f"{top_category} Issue"
        }
    except Exception as e:
        print(f"[AI PREDICTION ERROR] {e}")
        return {"success": True, "category": "Other Civic Issues", "confidence": 50.0, "issue": "Exception"}

@router.post("/ai/predict-urgency")
def predict_urgency(req: UrgencyReq):
    model, tokenizer, label_map = get_urgency_model()
    
    if not model or not tokenizer:
        return {
            "success": True, 
            "urgency": "Medium", 
            "confidence": 50.0, 
            "reason": "Routine civic issue assessment applied as safe fallback."
        }
        
    combined = f"Title: {req.title.strip()} Description: {req.description.strip()}"
    
    try:
        import torch
        inputs = tokenizer(combined, return_tensors="pt", truncation=True, padding=True, max_length=128)
        with torch.no_grad():
            outputs = model(**inputs)
            
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)[0]
        all_probs = {label_map[i]: float(p) * 100 for i, p in enumerate(probs)}
        
        sorted_probs = sorted(all_probs.items(), key=lambda x: x[1], reverse=True)
        top_urgency, confidence = sorted_probs[0]
        
        reason = ""
        if top_urgency == "Critical":
            reason = "Priority review recommended because the complaint suggests an immediate threat to life, active structural failure, or serious wide-scale safety risk."
        elif top_urgency == "High":
            reason = "Serious issue involving substantial disruption or potential harm, requiring priority handling."
        elif top_urgency == "Medium":
            reason = "Issue requires timely attention but has limited immediate danger."
        else:
            reason = "Routine issue categorized with limited immediate harm and no significant safety risk."
            
        return {
            "success": True,
            "urgency": top_urgency,
            "confidence": round(confidence, 2),
            "reason": reason
        }
    except Exception as e:
        print(f"[URGENCY ERROR] {e}")
        return {
            "success": True, 
            "urgency": "Medium", 
            "confidence": 50.0, 
            "reason": "Exception during AI evaluation. Standard priority applied."
        }

# --- DUPLICATE COMPLAINT DETECTION (MODEL 3) ---
class DuplicateDetectReq(BaseModel):
    title: str
    description: str = ""
    location: str = "Kothrud, Pune, Maharashtra"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    category: Optional[str] = ""
    user_id: Optional[int] = None

@router.post("/detect-duplicate")
@router.post("/ai/detect-duplicate")
def api_detect_duplicate(req: DuplicateDetectReq, db: Session = Depends(get_db)):
    try:
        from duplicate_service import detect_duplicates_in_db
        return detect_duplicates_in_db(
            title=req.title,
            description=req.description,
            location=req.location,
            latitude=req.latitude,
            longitude=req.longitude,
            category=req.category,
            user_id=req.user_id,
            db=db
        )
    except Exception as e:
        print(f"[DUPLICATE DETECTION API ERROR] {e}")
        return {
            "success": False,
            "has_duplicate": False,
            "decision": "error",
            "similarity_score": 0.0,
            "similarity_percent": 0.0,
            "matched_complaint": None,
            "location_comparison": None,
            "recommendation": "Unable to check duplicates at this moment. You may proceed with submission.",
            "error": str(e)
        }

class ChatReq(BaseModel):
    query: str
    user_id: Optional[int] = None

@router.post("/chatbot/ask")
def chatbot_ask(req: ChatReq):
    return {"success": True, "answer": "Hello from the FastAPI migrated SmartGov AI Bot! I can assist you dynamically now."}
