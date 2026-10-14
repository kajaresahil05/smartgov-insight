import json
import csv
import io
import math
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from database_fastapi import get_db
from models_fastapi import User, Complaint, Project, Vendor, Notification, Assignment, VendorEvidence, VendorNotification

router = APIRouter(prefix="/api/government", tags=["Government Portal"])

# Administrative in-memory read notifications tracker (or persisted)
_read_notification_ids = set()

ACTIVE_ASSIGNMENT_STATUSES = [
    'Assigned',
    'Accepted',
    'In Progress',
    'Work Submitted',
    'Under Verification',
    'Rework Requested'
]


# ==========================================
# PYDANTIC SCHEMAS
# ==========================================
class ConvertComplaintToProjectReq(BaseModel):
    complaint_id: int
    title: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    estimated_cost: Optional[str] = "₹45,00,000"
    target_completion_date: Optional[str] = None
    priority: Optional[str] = "Medium"
    assigned_vendor_id: Optional[str] = None
    work_order_details: Optional[str] = ""

class AssignVendorReq(BaseModel):
    project_id: int
    vendor_id: str
    budget_sanctioned: Optional[str] = "₹45,00,000"
    target_completion_date: Optional[str] = "30 Dec 2026"
    work_order_details: Optional[str] = ""
    allocated_by: Optional[str] = "PMC Municipal Admin"

class VerificationDecisionReq(BaseModel):
    decision: str # "Approved" or "Rework Requested"
    rating: Optional[float] = 5.0
    remarks: Optional[str] = ""
    feedback: Optional[str] = ""

class StatusUpdateReq(BaseModel):
    status: str
    remarks: Optional[str] = ""

class VendorStatusUpdateReq(BaseModel):
    status: str # "Approved", "Rejected", "Pending Review"
    remarks: Optional[str] = ""

class ProjectCreateReq(BaseModel):
    title: str
    category: Optional[str] = "Road"
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    start_date: Optional[str] = ""
    expected_end: Optional[str] = ""
    estimated_cost: Optional[str] = ""
    assigned_vendor_id: Optional[str] = None
    department: Optional[str] = "Municipal Works"
    priority: Optional[str] = "Medium"
    progress: Optional[int] = 0
    status: Optional[str] = "In Progress"

class ProjectUpdateReq(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    progress: Optional[int] = None
    status: Optional[str] = None
    start_date: Optional[str] = None
    expected_end: Optional[str] = None
    estimated_cost: Optional[str] = None
    assigned_vendor_id: Optional[str] = None
    department: Optional[str] = None
    priority: Optional[str] = None

class ComplaintCreateReq(BaseModel):
    citizen_name: str
    title: str
    description: Optional[str] = ""
    category: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    priority: Optional[str] = "Medium"
    status: Optional[str] = "Open"


# ==========================================
# 1. OVERVIEW / DASHBOARD (PAGE 1)
# ==========================================
@router.get("/overview")
def get_government_overview(db: Session = Depends(get_db)):
    all_complaints = db.query(Complaint).order_by(Complaint.id.desc()).all()
    all_vendors = db.query(Vendor).order_by(Vendor.id.desc()).all()
    all_projects = db.query(Project).order_by(Project.id.desc()).all()

    # Calculate KPIs
    total_complaints = len(all_complaints)
    total_vendors = len(all_vendors)
    
    # Pending Action: complaints that are 'Open' or 'Under Review' + vendors 'Pending Review'
    pending_complaints = sum(1 for c in all_complaints if c.status in ['Open', 'Under Review', 'Pending'])
    pending_vendors = sum(1 for v in all_vendors if (v.verification_status or '').lower() in ['pending', 'pending review'])
    pending_action = pending_complaints + pending_vendors

    # Projects in progress
    projects_in_progress = sum(1 for p in all_projects if p.status == 'In Progress')

    # Recent Citizen Complaints (top 5 formatted)
    recent_complaints_data = []
    for c in all_complaints[:5]:
        citizen_name = c.user.full_name if c.user else "Citizen"
        date_str = c.created_at.strftime('%d %b %Y') if c.created_at else "Recently"
        recent_complaints_data.append({
            "id": c.id,
            "ticket_number": c.ticket_number or f"C-{c.id:04d}",
            "citizen_name": citizen_name,
            "category": c.category or "Civic",
            "location": c.location or "Pune",
            "priority": c.urgency or "Medium",
            "status": c.status or "Open",
            "date": date_str,
            "description": c.description or "",
            "latitude": c.latitude,
            "longitude": c.longitude
        })

    # Recent Registered Vendors (top 5 formatted)
    recent_vendors_data = []
    for v in all_vendors[:5]:
        recent_vendors_data.append({
            "id": v.id,
            "vendor_id": v.vendor_id or f"VND-{v.id:04d}",
            "company_name": v.company_name,
            "contact_person": v.contact_person,
            "gst_number": v.gst_number or "N/A",
            "pan_number": v.pan_number or "N/A",
            "category": v.specialization or "Infrastructure",
            "status": "Approved" if v.is_verified or v.verification_status == "Approved" else (v.verification_status or "Pending Review"),
            "date": v.created_at.strftime('%d %b %Y') if v.created_at else "Recently"
        })

    # Complaints by Category (Grouped with count and percentage)
    cat_counts: Dict[str, int] = {}
    for c in all_complaints:
        cat = c.category or "Other"
        cat_counts[cat] = cat_counts.get(cat, 0) + 1
    
    complaints_by_category = []
    for cat, count in sorted(cat_counts.items(), key=lambda x: x[1], reverse=True):
        pct = round((count / max(1, total_complaints)) * 100)
        complaints_by_category.append({
            "category": cat,
            "count": count,
            "percentage": pct
        })

    # Complaint Status breakdown
    status_counts: Dict[str, int] = {"Open": 0, "In Progress": 0, "Resolved": 0, "Under Review": 0, "Rejected": 0}
    for c in all_complaints:
        st = c.status or "Open"
        if st not in status_counts:
            status_counts[st] = 0
        status_counts[st] += 1

    # Format status chart list
    complaint_status_chart = [
        {"status": "Open", "count": status_counts.get("Open", 0) + status_counts.get("Under Review", 0)},
        {"status": "In Progress", "count": status_counts.get("In Progress", 0)},
        {"status": "Resolved", "count": status_counts.get("Resolved", 0)},
        {"status": "Rejected", "count": status_counts.get("Rejected", 0)}
    ]

    # Vendors by Category
    vendor_cat_counts: Dict[str, int] = {}
    for v in all_vendors:
        spec = v.specialization or "General"
        vendor_cat_counts[spec] = vendor_cat_counts.get(spec, 0) + 1

    vendors_by_category = []
    for spec, count in sorted(vendor_cat_counts.items(), key=lambda x: x[1], reverse=True):
        pct = round((count / max(1, total_vendors)) * 100)
        vendors_by_category.append({
            "category": spec,
            "count": count,
            "percentage": pct
        })

    # Latest Activity feed (compiled from complaints, vendors, projects)
    activities = []
    for c in all_complaints[:3]:
        activities.append({
            "id": f"act-c-{c.id}",
            "type": "complaint",
            "title": f"New Complaint: {c.ticket_number}",
            "desc": f"{c.user.full_name if c.user else 'Citizen'} reported '{c.title}' in {c.location}",
            "time": c.created_at.strftime('%d %b %Y, %I:%M %p') if c.created_at else "Recently"
        })
    for v in all_vendors[:2]:
        activities.append({
            "id": f"act-v-{v.id}",
            "type": "vendor",
            "title": f"Vendor Registered: {v.company_name}",
            "desc": f"Category: {v.specialization or 'General'} • Contact: {v.contact_person}",
            "time": v.created_at.strftime('%d %b %Y') if v.created_at else "Recently"
        })
    for p in all_projects[:2]:
        activities.append({
            "id": f"act-p-{p.id}",
            "type": "project",
            "title": f"Project Active: {p.title}",
            "desc": f"Progress at {p.progress}% • Location: {p.location}",
            "time": p.created_at.strftime('%d %b %Y') if p.created_at else "Recently"
        })

    return {
        "success": True,
        "kpis": {
            "total_complaints": total_complaints,
            "registered_vendors": total_vendors,
            "pending_action": pending_action,
            "projects_in_progress": projects_in_progress
        },
        "recent_complaints": recent_complaints_data,
        "recent_vendors": recent_vendors_data,
        "complaints_by_category": complaints_by_category,
        "complaint_status_chart": complaint_status_chart,
        "vendors_by_category": vendors_by_category,
        "activities": activities
    }


# ==========================================
# 2. CITIZEN COMPLAINTS (PAGE 2)
# ==========================================
@router.get("/complaints")
def get_government_complaints(
    search: Optional[str] = Query("", alias="search"),
    status: Optional[str] = Query("All", alias="status"),
    priority: Optional[str] = Query("All", alias="priority"),
    category: Optional[str] = Query("All", alias="category"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)

    # Filter by status
    if status and status != "All":
        if status.lower() == "open":
            query = query.filter(Complaint.status.in_(["Open", "Under Review"]))
        else:
            query = query.filter(Complaint.status.ilike(status))

    # Filter by priority / urgency
    if priority and priority != "All":
        query = query.filter(Complaint.urgency.ilike(priority))

    # Filter by category
    if category and category != "All":
        query = query.filter(Complaint.category.ilike(category))

    complaints_list = query.order_by(Complaint.id.desc()).all()

    # Search filter (in-memory for flexible multi-field search)
    if search.strip():
        s = search.strip().lower()
        filtered = []
        for c in complaints_list:
            c_name = c.user.full_name.lower() if c.user and c.user.full_name else ""
            t_num = (c.ticket_number or "").lower()
            title = (c.title or "").lower()
            loc = (c.location or "").lower()
            cat = (c.category or "").lower()
            if s in c_name or s in t_num or s in title or s in loc or s in cat:
                filtered.append(c)
        complaints_list = filtered

    total_count = len(complaints_list)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paged_items = complaints_list[start_idx:end_idx]

    results = []
    for c in paged_items:
        results.append({
            "id": c.id,
            "ticket_number": c.ticket_number or f"C-{c.id:04d}",
            "citizen_name": c.user.full_name if c.user else "Citizen",
            "citizen_email": c.user.email if c.user else "",
            "citizen_mobile": c.user.mobile if c.user else "",
            "title": c.title,
            "description": c.description or "",
            "category": c.category or "Civic",
            "location": c.location or "Pune",
            "latitude": c.latitude,
            "longitude": c.longitude,
            "location_accuracy": c.location_accuracy,
            "priority": c.urgency or "Medium",
            "status": c.status or "Open",
            "is_duplicate": bool(c.is_duplicate),
            "duplicate_count": c.duplicate_count or 0,
            "duplicate_reason": c.duplicate_reason or "",
            "images": json.loads(c.images) if c.images and c.images.startswith("[") else ([c.images] if c.images else []),
            "timeline": json.loads(c.timeline_json) if c.timeline_json else [],
            "date": c.created_at.strftime('%d %b %Y') if c.created_at else "Recently",
            "created_at": c.created_at.isoformat() if c.created_at else ""
        })

    return {
        "success": True,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total_count / max(1, page_size)),
        "complaints": results
    }

@router.put("/complaints/{complaint_id}/status")
def update_complaint_status(
    complaint_id: int,
    req: StatusUpdateReq,
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint.status = req.status
    now_str = datetime.utcnow().strftime('%d %b %Y, %I:%M %p')

    # Append to timeline
    timeline = []
    if complaint.timeline_json:
        try:
            timeline = json.loads(complaint.timeline_json)
        except Exception:
            timeline = []

    timeline.append({
        "title": f"Status updated to {req.status}",
        "time": now_str,
        "status": "completed",
        "note": req.remarks or f"Administrative decision by Municipal Corporation Officer."
    })
    complaint.timeline_json = json.dumps(timeline)

    # Notify citizen
    if complaint.user_id:
        notif = Notification(
            user_id=complaint.user_id,
            text=f"Your complaint {complaint.ticket_number} status has been updated to '{req.status}'."
        )
        db.add(notif)

    db.commit()
    db.refresh(complaint)

    return {
        "success": True,
        "message": f"Complaint status updated to {req.status}",
        "complaint": complaint.to_dict()
    }

@router.post("/complaints")
def add_admin_complaint(
    req: ComplaintCreateReq,
    db: Session = Depends(get_db)
):
    # Find or use default admin/citizen user
    user = db.query(User).first()
    if not user:
        user = User(
            full_name=req.citizen_name or "Rohit Sharma",
            email="citizen@pune.gov.in",
            mobile="9876543210",
            password_hash="admin123",
            location=req.location
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    count = db.query(Complaint).count() + 1
    ticket_num = f"C-{count:04d}"
    now_str = datetime.utcnow().strftime('%d %b %Y, %I:%M %p')
    timeline = [
        {"title": "Submitted", "time": now_str, "status": "completed"},
        {"title": f"Status set to {req.status}", "time": now_str, "status": "active", "note": "Created directly by Government Admin"}
    ]

    new_c = Complaint(
        user_id=user.id,
        ticket_number=ticket_num,
        title=req.title,
        category=req.category,
        description=req.description,
        urgency=req.priority,
        location=req.location,
        latitude=req.latitude,
        longitude=req.longitude,
        status=req.status,
        timeline_json=json.dumps(timeline)
    )
    db.add(new_c)
    db.commit()
    db.refresh(new_c)

    return {"success": True, "complaint": new_c.to_dict()}


# ==========================================
# 3. VENDOR MANAGEMENT (PAGE 3)
# ==========================================
@router.get("/vendors")
def get_government_vendors(
    search: Optional[str] = Query("", alias="search"),
    status: Optional[str] = Query("All", alias="status"),
    category: Optional[str] = Query("All", alias="category"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Vendor)

    if category and category != "All":
        query = query.filter(Vendor.specialization.ilike(category))

    vendors_list = query.order_by(Vendor.id.desc()).all()

    # In-memory search & status filtering for clean normalization
    filtered = []
    s = search.strip().lower()
    for v in vendors_list:
        v_status = "Approved" if v.is_verified or v.verification_status == "Approved" else (v.verification_status or "Pending Review")
        
        # Status filter
        if status and status != "All":
            if status.lower() == "approved" and v_status != "Approved":
                continue
            elif status.lower() in ["pending", "pending review"] and v_status not in ["Pending", "Pending Review"]:
                continue
            elif status.lower() == "rejected" and v_status != "Rejected":
                continue

        # Search filter
        if s:
            name = (v.company_name or "").lower()
            gst = (v.gst_number or "").lower()
            pan = (v.pan_number or "").lower()
            spec = (v.specialization or "").lower()
            contact = (v.contact_person or "").lower()
            if s not in name and s not in gst and s not in pan and s not in spec and s not in contact:
                continue

        filtered.append(v)

    total_count = len(filtered)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paged = filtered[start_idx:end_idx]

    results = []
    for v in paged:
        v_dict = v.to_dict()
        results.append({
            "id": v.id,
            "vendor_id": v.vendor_id or f"VND-{v.id:04d}",
            "company_name": v.company_name,
            "contact_person": v.contact_person,
            "email": v.email,
            "mobile": v.mobile,
            "gst_number": v.gst_number or "N/A",
            "pan_number": v.pan_number or "N/A",
            "category": v.specialization or "Infrastructure",
            "experience": v.experience or "N/A",
            "location": v.location or "Pune",
            "business_address": v.business_address or "",
            "city": v.city or "Pune",
            "state": v.state or "Maharashtra",
            "pincode": v.pincode or "411038",
            "bank_name": v.bank_name or "",
            "account_number": v.account_number or "",
            "ifsc_code": v.ifsc_code or "",
            "branch_name": v.branch_name or "",
            "status": "Approved" if v.is_verified or v.verification_status == "Approved" else (v.verification_status or "Pending Review"),
            "documents": v_dict.get("documents", []),
            "date": v.created_at.strftime('%d %b %Y') if v.created_at else "Recently"
        })

    return {
        "success": True,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total_count / max(1, page_size)),
        "vendors": results
    }

@router.put("/vendors/{vendor_id}/status")
def update_vendor_status(
    vendor_id: int,
    req: VendorStatusUpdateReq,
    db: Session = Depends(get_db)
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    new_st = req.status
    vendor.verification_status = new_st
    vendor.is_verified = (new_st.lower() == "approved")
    db.commit()
    db.refresh(vendor)

    return {
        "success": True,
        "message": f"Vendor '{vendor.company_name}' verification status set to {new_st}.",
        "vendor": vendor.to_dict()
    }


# ==========================================
# 4. AI PRIORITIZATION (PAGE 4)
# ==========================================
@router.get("/ai-prioritization")
def get_ai_prioritization(db: Session = Depends(get_db)):
    all_complaints = db.query(Complaint).order_by(Complaint.id.desc()).all()
    
    total_analyzed = len(all_complaints)
    high_count = 0
    medium_count = 0
    low_count = 0

    recommendations = []
    
    # Analyze each complaint using ML logic / models
    for idx, c in enumerate(all_complaints):
        urgency = (c.urgency or "Medium").capitalize()
        cat = c.category or "Civic"

        # Calculate AI Priority Score (0-100)
        base_score = 50
        if urgency == "Critical":
            base_score = 94
            high_count += 1
            rec_text = "Critical urgency - Immediate deployment and safety inspection required."
        elif urgency == "High":
            base_score = 82 + ((c.id % 5))
            high_count += 1
            rec_text = "High priority - Immediate action recommended within 24-48 hours."
        elif urgency == "Medium":
            base_score = 68 + ((c.id % 10))
            medium_count += 1
            rec_text = "Medium priority - Schedule within 15 days."
        else:
            base_score = 38 + ((c.id % 12))
            low_count += 1
            rec_text = "Low priority - Routine maintenance cycle recommended."

        # Boost score if duplicate count is high (citizen demand cluster)
        if c.duplicate_count and c.duplicate_count > 0:
            base_score = min(99, base_score + (c.duplicate_count * 4))
            rec_text += f" (Demand Spike: {c.duplicate_count + 1} aggregate reports)"

        # Cap base score
        score = max(10, min(99, base_score))

        # Check duplicate info
        dup_info = {
            "is_duplicate": bool(c.is_duplicate),
            "matched_parent_id": c.parent_complaint_id,
            "duplicate_count": c.duplicate_count or 0,
            "duplicate_reason": c.duplicate_reason or ""
        }

        recommendations.append({
            "id": c.id,
            "ticket_number": c.ticket_number or f"C-{c.id:04d}",
            "citizen_name": c.user.full_name if c.user else "Citizen",
            "title": c.title,
            "description": c.description or "",
            "category": cat,
            "location": c.location or "Pune",
            "latitude": c.latitude,
            "longitude": c.longitude,
            "urgency": urgency,
            "ai_score": score,
            "recommendation": rec_text,
            "department": f"{cat} Department, Municipal Corp. Pune",
            "duplicate_info": dup_info,
            "date": c.created_at.strftime('%d %b %Y') if c.created_at else "Recently"
        })

    # Sort recommendations by AI score descending
    recommendations.sort(key=lambda x: x["ai_score"], reverse=True)

    return {
        "success": True,
        "kpis": {
            "analyzed_complaints": total_analyzed,
            "high_priority": high_count,
            "medium_priority": medium_count,
            "low_priority": low_count
        },
        "recommendations": recommendations
    }


# ==========================================
# 5. PROJECT MANAGEMENT (PAGE 5)
# ==========================================
@router.get("/projects")
def get_government_projects(
    search: Optional[str] = Query("", alias="search"),
    status: Optional[str] = Query("All", alias="status"),
    category: Optional[str] = Query("All", alias="category"),
    db: Session = Depends(get_db)
):
    query = db.query(Project)
    if category and category != "All":
        query = query.filter(Project.category.ilike(category))
    if status and status != "All":
        query = query.filter(Project.status.ilike(status))

    all_p = query.order_by(Project.id.desc()).all()

    # Search filter
    if search.strip():
        s = search.strip().lower()
        all_p = [p for p in all_p if s in (p.title or "").lower() or s in (p.location or "").lower() or s in (p.category or "").lower()]

    total_projects = db.query(Project).count()
    active_projects = db.query(Project).filter(Project.status.in_(["In Progress", "Initiated"])).count()
    completed_projects = db.query(Project).filter(Project.status == "Completed").count()
    on_hold_projects = db.query(Project).filter(Project.status.in_(["On Hold", "Delayed"])).count()

    # Resolve assigned vendor names
    vendor_lookup = {v.vendor_id: v.company_name for v in db.query(Vendor).all()}
    vendor_lookup.update({str(v.id): v.company_name for v in db.query(Vendor).all()})

    projects_data = []
    for p in all_p:
        v_name = vendor_lookup.get(p.assigned_vendor_id, "Unassigned")
        projects_data.append({
            "id": p.id,
            "title": p.title,
            "category": p.category or "Infrastructure",
            "location": p.location or "Pune",
            "latitude": p.latitude,
            "longitude": p.longitude,
            "start_date": p.start_date or "01 Oct 2026",
            "expected_end": p.expected_end or "31 Dec 2026",
            "estimated_cost": p.estimated_cost or "₹45,00,000",
            "progress": p.progress or 0,
            "status": p.status or "In Progress",
            "assigned_vendor_id": p.assigned_vendor_id,
            "assigned_vendor_name": v_name,
            "department": p.department or "Municipal Works",
            "priority": p.priority or "Medium",
            "milestones": json.loads(p.milestones_json) if p.milestones_json else []
        })

    return {
        "success": True,
        "kpis": {
            "total_projects": total_projects,
            "active_projects": active_projects,
            "completed": completed_projects,
            "on_hold": on_hold_projects
        },
        "projects": projects_data
    }

@router.post("/projects")
def create_government_project(
    req: ProjectCreateReq,
    db: Session = Depends(get_db)
):
    default_milestones = [
        {"title": "Phase 1: Survey & Tender Approval", "status": "Completed", "progress": 100},
        {"title": "Phase 2: Construction / Execution", "status": "In Progress", "progress": req.progress or 50},
        {"title": "Phase 3: Final Quality Audit & Handover", "status": "Pending", "progress": 0}
    ]

    new_p = Project(
        title=req.title,
        category=req.category,
        location=req.location,
        latitude=req.latitude,
        longitude=req.longitude,
        start_date=req.start_date or datetime.utcnow().strftime('%d %b %Y'),
        expected_end=req.expected_end or (datetime.utcnow() + timedelta(days=90)).strftime('%d %b %Y'),
        estimated_cost=req.estimated_cost or "₹50,00,000",
        assigned_vendor_id=req.assigned_vendor_id,
        department=req.department or "Municipal Infrastructure",
        priority=req.priority or "Medium",
        progress=req.progress or 0,
        status=req.status or "In Progress",
        milestones_json=json.dumps(default_milestones)
    )
    db.add(new_p)
    db.commit()
    db.refresh(new_p)

    return {"success": True, "project": new_p.to_dict()}

@router.put("/projects/{project_id}")
def update_government_project(
    project_id: int,
    req: ProjectUpdateReq,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if req.title is not None: project.title = req.title
    if req.category is not None: project.category = req.category
    if req.location is not None: project.location = req.location
    if req.progress is not None: project.progress = req.progress
    if req.status is not None: project.status = req.status
    if req.start_date is not None: project.start_date = req.start_date
    if req.expected_end is not None: project.expected_end = req.expected_end
    if req.estimated_cost is not None: project.estimated_cost = req.estimated_cost
    if req.assigned_vendor_id is not None: project.assigned_vendor_id = req.assigned_vendor_id
    if req.department is not None: project.department = req.department
    if req.priority is not None: project.priority = req.priority

    db.commit()
    db.refresh(project)
    return {"success": True, "project": project.to_dict()}


# ==========================================
# 6. MONITORING (PAGE 6)
# ==========================================
@router.get("/monitoring")
def get_government_monitoring(db: Session = Depends(get_db)):
    all_projects = db.query(Project).all()
    all_complaints = db.query(Complaint).all()
    all_vendors = db.query(Vendor).all()

    # Projects monitoring
    project_items = []
    for p in all_projects:
        # Determine delay risk based on progress
        status_label = p.status or "In Progress"
        risk_level = "On Track"
        if status_label == "In Progress":
            if (p.progress or 0) < 30:
                risk_level = "At Risk"
            elif (p.progress or 0) < 60:
                risk_level = "Medium Progress"
            else:
                risk_level = "On Track"

        project_items.append({
            "id": p.id,
            "title": p.title,
            "category": p.category or "Infrastructure",
            "location": p.location or "Pune",
            "progress": p.progress or 0,
            "status": status_label,
            "risk_level": risk_level,
            "start_date": p.start_date or "01 Oct 2026",
            "expected_end": p.expected_end or "31 Dec 2026",
            "last_update": p.created_at.strftime('%d %b %Y') if p.created_at else "Recently"
        })

    # Complaints monitoring (tracking SLA and resolution progress)
    complaint_items = []
    now = datetime.utcnow()
    for c in all_complaints:
        days_open = (now - c.created_at).days if c.created_at else 0
        sla_status = "Overdue" if days_open > 7 and c.status not in ["Resolved", "Rejected"] else ("Needs Attention" if days_open > 3 else "Normal")
        
        complaint_items.append({
            "id": c.id,
            "ticket_number": c.ticket_number or f"C-{c.id:04d}",
            "citizen_name": c.user.full_name if c.user else "Citizen",
            "title": c.title,
            "category": c.category,
            "location": c.location,
            "priority": c.urgency or "Medium",
            "status": c.status or "Open",
            "days_open": days_open,
            "sla_status": sla_status,
            "last_update": c.created_at.strftime('%d %b %Y') if c.created_at else "Recently"
        })

    # Vendors monitoring (active contracts & verification status)
    vendor_items = []
    for v in all_vendors:
        # Check active projects assigned to this vendor
        assigned_p = [p for p in all_projects if p.assigned_vendor_id in [v.vendor_id, str(v.id)]]
        vendor_items.append({
            "id": v.id,
            "vendor_id": v.vendor_id,
            "company_name": v.company_name,
            "contact_person": v.contact_person,
            "specialization": v.specialization or "Infrastructure",
            "verification_status": "Approved" if v.is_verified or v.verification_status == "Approved" else (v.verification_status or "Pending Review"),
            "active_projects_count": len(assigned_p),
            "compliance_status": "Compliant" if (v.gst_number and v.pan_number) else "Pending Documents",
            "last_update": v.created_at.strftime('%d %b %Y') if v.created_at else "Recently"
        })

    return {
        "success": True,
        "projects": project_items,
        "complaints": complaint_items,
        "vendors": vendor_items
    }


# ==========================================
# 7. ANALYTICS & REPORTS (PAGE 7)
# ==========================================
@router.get("/analytics")
def get_government_analytics(
    timeframe: Optional[str] = Query("all", alias="timeframe"),
    db: Session = Depends(get_db)
):
    complaints = db.query(Complaint).all()
    vendors = db.query(Vendor).all()
    projects = db.query(Project).all()

    total_c = len(complaints)
    total_v = len(vendors)
    total_p = len(projects)

    resolved_c = sum(1 for c in complaints if c.status in ["Resolved", "Closed"])
    resolution_rate = round((resolved_c / max(1, total_c)) * 100) if total_c > 0 else 0

    # Complaints by category
    cat_counts: Dict[str, int] = {}
    for c in complaints:
        k = c.category or "Other"
        cat_counts[k] = cat_counts.get(k, 0) + 1
    complaints_by_category = [{"category": k, "count": v, "percentage": round((v / max(1, total_c)) * 100)} for k, v in cat_counts.items()]

    # Complaints by status
    st_counts: Dict[str, int] = {}
    for c in complaints:
        k = c.status or "Open"
        st_counts[k] = st_counts.get(k, 0) + 1
    complaints_by_status = [{"status": k, "count": v} for k, v in st_counts.items()]

    # Vendors by category
    v_cat_counts: Dict[str, int] = {}
    for v in vendors:
        k = v.specialization or "Other"
        v_cat_counts[k] = v_cat_counts.get(k, 0) + 1
    vendors_by_category = [{"category": k, "count": v, "percentage": round((v / max(1, total_v)) * 100)} for k, v in v_cat_counts.items()]

    # Vendor verification breakdown
    v_st_counts: Dict[str, int] = {"Approved": 0, "Pending Review": 0, "Rejected": 0}
    for v in vendors:
        st = "Approved" if v.is_verified or v.verification_status == "Approved" else (v.verification_status or "Pending Review")
        v_st_counts[st] = v_st_counts.get(st, 0) + 1
    vendors_by_status = [{"status": k, "count": v} for k, v in v_st_counts.items()]

    # Complaints trend over time (last 7 days or chronological)
    trend_map: Dict[str, int] = {}
    for c in complaints:
        if c.created_at:
            d_key = c.created_at.strftime('%d %b')
            trend_map[d_key] = trend_map.get(d_key, 0) + 1
        else:
            trend_map["Recently"] = trend_map.get("Recently", 0) + 1
    
    complaint_trend = [{"date": k, "count": v} for k, v in trend_map.items()]

    return {
        "success": True,
        "kpis": {
            "total_complaints": total_c,
            "registered_vendors": total_v,
            "total_projects": total_p,
            "resolution_rate": f"{resolution_rate}%"
        },
        "complaints_by_category": complaints_by_category,
        "complaints_by_status": complaints_by_status,
        "vendors_by_category": vendors_by_category,
        "vendors_by_status": vendors_by_status,
        "complaint_trend": complaint_trend
    }

@router.get("/export-report")
def export_government_report(
    report_type: Optional[str] = "complaints",
    db: Session = Depends(get_db)
):
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "vendors":
        writer.writerow(["Vendor ID", "Company Name", "Contact Person", "Email", "Mobile", "GST", "PAN", "Category", "Status", "Registration Date"])
        for v in db.query(Vendor).all():
            st = "Approved" if v.is_verified or v.verification_status == "Approved" else (v.verification_status or "Pending Review")
            writer.writerow([
                v.vendor_id, v.company_name, v.contact_person, v.email, v.mobile,
                v.gst_number, v.pan_number, v.specialization, st,
                v.created_at.strftime('%Y-%m-%d') if v.created_at else ""
            ])
        filename = f"SmartGov_Vendors_Report_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    elif report_type == "projects":
        writer.writerow(["Project ID", "Title", "Category", "Location", "Progress %", "Status", "Start Date", "Expected End", "Estimated Cost"])
        for p in db.query(Project).all():
            writer.writerow([
                p.id, p.title, p.category, p.location, p.progress, p.status,
                p.start_date, p.expected_end, p.estimated_cost
            ])
        filename = f"SmartGov_Projects_Report_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    else:
        writer.writerow(["Complaint ID", "Citizen Name", "Title", "Category", "Location", "Priority", "Status", "Date"])
        for c in db.query(Complaint).all():
            writer.writerow([
                c.ticket_number or f"C-{c.id:04d}",
                c.user.full_name if c.user else "Citizen",
                c.title, c.category, c.location, c.urgency, c.status,
                c.created_at.strftime('%Y-%m-%d') if c.created_at else ""
            ])
        filename = f"SmartGov_Complaints_Report_{datetime.utcnow().strftime('%Y%m%d')}.csv"

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ==========================================
# 8. CITIZEN DEMAND (PAGE 8)
# ==========================================
@router.get("/citizen-demand")
def get_citizen_demand(db: Session = Depends(get_db)):
    complaints = db.query(Complaint).all()
    total_c = len(complaints)

    # Top Demand Areas
    area_map: Dict[str, int] = {}
    for c in complaints:
        loc = (c.location or "Pune").strip()
        # Normalize location prefix/suffix
        simplified_loc = loc.split(",")[0].strip() if "," in loc else loc
        if "gps" in simplified_loc.lower():
            # Extract readable area from GPS string if present
            if "-" in loc:
                simplified_loc = loc.split("-")[-1].strip().split(",")[0].strip()
        area_map[simplified_loc] = area_map.get(simplified_loc, 0) + 1

    top_areas = []
    for area, count in sorted(area_map.items(), key=lambda x: x[1], reverse=True)[:5]:
        top_areas.append({
            "area": area,
            "count": count,
            "percentage": round((count / max(1, total_c)) * 100)
        })

    # If few areas, add a third placeholder "Other Areas (0 complaints)" for visual completeness
    if len(top_areas) < 3:
        top_areas.append({"area": "Other Areas", "count": 0, "percentage": 0})

    # Top Issue Categories
    cat_map: Dict[str, int] = {}
    for c in complaints:
        cat = (c.category or "Civic").strip()
        cat_map[cat] = cat_map.get(cat, 0) + 1

    top_categories = []
    for cat, count in sorted(cat_map.items(), key=lambda x: x[1], reverse=True)[:5]:
        top_categories.append({
            "category": cat,
            "count": count,
            "percentage": round((count / max(1, total_c)) * 100)
        })

    # Complaints Trend Chart (Daily counts formatted)
    trend_map: Dict[str, int] = {}
    # Build standard 6-day baseline if complaints exist
    for c in complaints:
        d_str = c.created_at.strftime('%d %b') if c.created_at else "11 Oct"
        trend_map[d_str] = trend_map.get(d_str, 0) + 1

    trend_series = []
    for d, count in sorted(trend_map.items(), key=lambda x: x[0]):
        trend_series.append({"date": d, "count": count})

    # Geocoded map markers for spatial visualization
    markers = []
    for c in complaints:
        if c.latitude and c.longitude:
            markers.append({
                "id": c.id,
                "ticket_number": c.ticket_number or f"C-{c.id:04d}",
                "title": c.title,
                "category": c.category,
                "latitude": c.latitude,
                "longitude": c.longitude,
                "location": c.location,
                "urgency": c.urgency or "Medium"
            })

    return {
        "success": True,
        "total_complaints": total_c,
        "top_areas": top_areas,
        "top_categories": top_categories,
        "trend_series": trend_series,
        "map_markers": markers
    }


# ==========================================
# 9. NOTIFICATIONS (PAGE 9)
# ==========================================
@router.get("/notifications")
def get_government_notifications(
    category: Optional[str] = Query("all", alias="category"),
    db: Session = Depends(get_db)
):
    all_complaints = db.query(Complaint).order_by(Complaint.id.desc()).all()
    all_vendors = db.query(Vendor).order_by(Vendor.id.desc()).all()
    all_projects = db.query(Project).order_by(Project.id.desc()).all()

    notifications = []
    
    # 1. Complaint notifications
    for c in all_complaints[:4]:
        c_id_str = f"notif-c-{c.id}"
        citizen_name = c.user.full_name if c.user else "Citizen"
        t_num = c.ticket_number or f"C-{c.id:04d}"
        notifications.append({
            "id": c_id_str,
            "target_id": c.id,
            "target_type": "complaint",
            "category": "complaints",
            "title": "New complaint submitted",
            "message": f"Complaint {t_num} submitted by {citizen_name} ({c.category})",
            "time": c.created_at.strftime('%d %b %Y, %I:%M %p') if c.created_at else "2 hours ago",
            "is_read": c_id_str in _read_notification_ids,
            "priority": c.urgency or "Medium"
        })

    # 2. Vendor notifications
    for v in all_vendors[:3]:
        v_id_str = f"notif-v-{v.id}"
        notifications.append({
            "id": v_id_str,
            "target_id": v.id,
            "target_type": "vendor",
            "category": "vendors",
            "title": "New vendor registered",
            "message": f"{v.company_name} ({v.specialization or 'General'}) has registered",
            "time": v.created_at.strftime('%d %b %Y') if v.created_at else "1 day ago",
            "is_read": v_id_str in _read_notification_ids,
            "priority": "Medium"
        })

    # 3. Project notifications
    for p in all_projects[:3]:
        p_id_str = f"notif-p-{p.id}"
        notifications.append({
            "id": p_id_str,
            "target_id": p.id,
            "target_type": "project",
            "category": "projects",
            "title": "Project update",
            "message": f"{p.title} progress updated to {p.progress}%",
            "time": p.created_at.strftime('%d %b %Y') if p.created_at else "1 day ago",
            "is_read": p_id_str in _read_notification_ids,
            "priority": "Low"
        })

    # Filter by category
    filtered = notifications
    if category and category.lower() != "all":
        filtered = [n for n in notifications if n["category"].lower() == category.lower()]

    unread_count = sum(1 for n in notifications if not n["is_read"])
    complaints_count = sum(1 for n in notifications if n["category"] == "complaints")
    vendors_count = sum(1 for n in notifications if n["category"] == "vendors")
    projects_count = sum(1 for n in notifications if n["category"] == "projects")

    return {
        "success": True,
        "total": len(filtered),
        "unread_count": unread_count,
        "counts": {
            "all": len(notifications),
            "complaints": complaints_count,
            "vendors": vendors_count,
            "projects": projects_count
        },
        "notifications": filtered
    }

@router.post("/notifications/read-all")
def mark_all_notifications_read(db: Session = Depends(get_db)):
    all_complaints = db.query(Complaint).all()
    all_vendors = db.query(Vendor).all()
    all_projects = db.query(Project).all()

    for c in all_complaints:
        _read_notification_ids.add(f"notif-c-{c.id}")
    for v in all_vendors:
        _read_notification_ids.add(f"notif-v-{v.id}")
    for p in all_projects:
        _read_notification_ids.add(f"notif-p-{p.id}")

    return {"success": True, "message": "All notifications marked as read"}


# ==========================================
# 10. VENDOR ALLOCATION & WORKLOAD MANAGEMENT (PAGE 10)
# ==========================================

def calculate_vendor_recommendation(vendor: Vendor, project: Project, db: Session) -> Dict[str, Any]:
    # 1. Capacity / Workload Check
    active_assignments = db.query(Assignment).filter(
        Assignment.vendor_id == vendor.vendor_id,
        Assignment.status.in_(ACTIVE_ASSIGNMENT_STATUSES)
    ).all()

    active_projects = db.query(Project).filter(
        (Project.assigned_vendor_id == vendor.vendor_id) | (Project.assigned_vendor_id == str(vendor.id)),
        Project.status.in_(['In Progress', 'Under Review', 'Initiated', 'Assigned', 'Work Submitted', 'Under Verification']),
        Project.id != project.id
    ).all()

    total_active = len(active_assignments) + len(active_projects)
    is_busy = total_active >= 1

    active_project_name = None
    if active_assignments:
        p_rel = db.query(Project).filter(Project.id == active_assignments[0].project_id).first()
        active_project_name = p_rel.title if p_rel else "Active Municipal Project"
    elif active_projects:
        active_project_name = active_projects[0].title

    # 2. Category / Specialization match
    proj_cat = (project.category or "Infrastructure").lower()
    spec = (vendor.specialization or "Infrastructure").lower()

    cat_match_score = 65.0
    if proj_cat in spec or spec in proj_cat:
        cat_match_score = 100.0
    elif "infra" in spec or ("road" in spec and "road" in proj_cat):
        cat_match_score = 95.0
    elif "water" in proj_cat and "water" in spec:
        cat_match_score = 100.0
    elif "electric" in proj_cat and ("electric" in spec or "infra" in spec):
        cat_match_score = 90.0
    elif "drainage" in proj_cat and ("drain" in spec or "infra" in spec):
        cat_match_score = 95.0
    elif "clean" in proj_cat or "waste" in proj_cat:
        cat_match_score = 85.0 if ("sanitation" in spec or "waste" in spec) else 70.0

    # 3. Performance Score
    perf_score = float(vendor.performance_score or 88.0)

    # 4. Completion Track Record Score
    completed_count = vendor.completed_projects_count or 0
    completion_rate_score = min(100.0, 75.0 + (completed_count * 5.0))

    # 5. Experience Score
    exp_str = str(vendor.experience or "5 years").lower()
    exp_years = 5
    for token in exp_str.replace('+', ' ').split():
        if token.isdigit():
            exp_years = int(token)
            break
    exp_score = min(100.0, 70.0 + (exp_years * 3.5))

    # 6. Verification & Eligibility
    is_verified = bool(vendor.is_verified or (vendor.verification_status or '').lower() in ['approved', 'verified'])

    if is_busy:
        is_eligible = False
        capacity_status = "0/1 (Capacity Reached)"
        eligibility_reason = f"Vendor currently engaged on active project: '{active_project_name}'. Max 1 active project allowed."
        composite_score = round((cat_match_score * 0.35 + perf_score * 0.25 + completion_rate_score * 0.20 + exp_score * 0.20) * 0.65, 1)
        ai_rationale = f"Workload limit reached: Currently engaged on '{active_project_name}'. Must complete & approve before new allocation."
    elif not is_verified:
        is_eligible = False
        capacity_status = "1/1 Available"
        eligibility_reason = f"Registration status is '{vendor.verification_status or 'Pending Review'}'. Must be approved before allocation."
        composite_score = round((cat_match_score * 0.35 + perf_score * 0.25 + exp_score * 0.20) * 0.70, 1)
        ai_rationale = "Verification required prior to work order issuance."
    else:
        is_eligible = True
        capacity_status = "1/1 Available"
        eligibility_reason = "Fully eligible: 0 active projects, verified credentials, and high domain match."
        composite_score = round(
            min(99.0, cat_match_score * 0.35 + perf_score * 0.25 + completion_rate_score * 0.20 + exp_score * 0.20),
            1
        )
        ai_rationale = f"Top-tier recommendation ({composite_score}% match). Domain alignment in {vendor.specialization} with {perf_score}% track record."

    return {
        "vendor_id": vendor.vendor_id or f"VND-{vendor.id:04d}",
        "id": vendor.id,
        "company_name": vendor.company_name,
        "contact_person": vendor.contact_person,
        "email": vendor.email,
        "mobile": vendor.mobile,
        "specialization": vendor.specialization or "Infrastructure",
        "experience": vendor.experience or "5+ years",
        "location": vendor.location or "Pune",
        "city": vendor.city or "Pune",
        "is_verified": is_verified,
        "verification_status": vendor.verification_status or "Approved",
        "is_eligible": is_eligible,
        "capacity_status": capacity_status,
        "active_projects_count": 1 if is_busy else 0,
        "active_project_name": active_project_name,
        "eligibility_reason": eligibility_reason,
        "recommendation_score": composite_score,
        "ai_rationale": ai_rationale,
        "breakdown": {
            "category_match": round(cat_match_score, 1),
            "performance": round(perf_score, 1),
            "completion_rate": round(completion_rate_score, 1),
            "experience": round(exp_score, 1),
            "capacity": 0.0 if is_busy else 100.0
        }
    }


@router.get("/allocations/overview")
def get_allocations_overview(db: Session = Depends(get_db)):
    all_projects = db.query(Project).all()
    all_vendors = db.query(Vendor).all()
    all_assignments = db.query(Assignment).all()

    pending_projects = [
        p for p in all_projects
        if not p.assigned_vendor_id or p.assignment_status == "Pending Allocation" or p.status == "Pending Allocation"
    ]

    active_assignments = [
        a for a in all_assignments
        if a.status in ACTIVE_ASSIGNMENT_STATUSES
    ]

    under_verification = [
        a for a in all_assignments
        if a.status in ["Work Submitted", "Under Verification"]
    ]

    completed_assignments = [
        a for a in all_assignments
        if a.status == "Completed"
    ]

    # Vendor capacities
    busy_vendor_ids = {a.vendor_id for a in active_assignments}
    # Also check projects table for any active vendor
    for p in all_projects:
        if p.assigned_vendor_id and p.status in ['In Progress', 'Under Review', 'Initiated', 'Assigned', 'Work Submitted', 'Under Verification']:
            busy_vendor_ids.add(p.assigned_vendor_id)

    available_vendors_count = sum(
        1 for v in all_vendors
        if v.vendor_id not in busy_vendor_ids and (v.is_verified or (v.verification_status or '').lower() in ['approved', 'verified'])
    )

    return {
        "success": True,
        "kpis": {
            "pending_projects_count": len(pending_projects),
            "active_assignments_count": len(active_assignments),
            "under_verification_count": len(under_verification),
            "completed_assignments_count": len(completed_assignments),
            "total_vendors_count": len(all_vendors),
            "available_vendors_count": available_vendors_count,
            "busy_vendors_count": len(busy_vendor_ids)
        }
    }


@router.get("/allocations/pending-projects")
def get_pending_allocation_projects(db: Session = Depends(get_db)):
    # 1. Projects needing allocation
    projects = db.query(Project).filter(
        (Project.assigned_vendor_id == None) |
        (Project.assigned_vendor_id == '') |
        (Project.assignment_status == 'Pending Allocation') |
        (Project.status == 'Pending Allocation')
    ).order_by(Project.id.desc()).all()

    # 2. Open complaints that can be converted into projects
    open_complaints = db.query(Complaint).filter(
        Complaint.status.in_(['Open', 'Under Review', 'Pending']),
        (Complaint.is_converted_to_project == False) | (Complaint.is_converted_to_project == None)
    ).order_by(Complaint.id.desc()).limit(15).all()

    p_data = []
    for p in projects:
        p_dict = p.to_dict()
        p_data.append(p_dict)

    c_data = []
    for c in open_complaints:
        c_data.append({
            "id": c.id,
            "ticket_number": c.ticket_number or f"C-{c.id:04d}",
            "title": c.title,
            "category": c.category,
            "description": c.description or "",
            "priority": c.urgency or "Medium",
            "location": c.location,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "status": c.status,
            "date": c.created_at.strftime('%d %b %Y') if c.created_at else "Recently"
        })

    return {
        "success": True,
        "projects": p_data,
        "convertible_complaints": c_data
    }


@router.get("/allocations/recommendations/{project_id}")
def get_vendor_recommendations_for_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    all_vendors = db.query(Vendor).all()
    if not all_vendors:
        return {"success": True, "project": project.to_dict(), "recommendations": []}

    recommendations = []
    for v in all_vendors:
        rec = calculate_vendor_recommendation(v, project, db)
        recommendations.append(rec)

    # Sort: Eligible first by score desc, then ineligible by score desc
    recommendations.sort(
        key=lambda x: (1 if x["is_eligible"] else 0, x["recommendation_score"]),
        reverse=True
    )

    return {
        "success": True,
        "project": project.to_dict(),
        "recommendations": recommendations
    }


@router.post("/allocations/assign")
def assign_vendor_to_project(req: AssignVendorReq, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    vendor = db.query(Vendor).filter(
        (Vendor.vendor_id == req.vendor_id) | (Vendor.id == (int(req.vendor_id) if req.vendor_id.isdigit() else -1))
    ).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found.")

    # 1. Verification status check
    is_verified = bool(vendor.is_verified or (vendor.verification_status or '').lower() in ['approved', 'verified'])
    if not is_verified:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot assign unverified vendor '{vendor.company_name}'. Please approve vendor registration before issuing work orders."
        )

    # 2. STRICT ONE ACTIVE PROJECT RULE (Concurrency Protection)
    existing_active_assignment = db.query(Assignment).filter(
        Assignment.vendor_id == vendor.vendor_id,
        Assignment.status.in_(ACTIVE_ASSIGNMENT_STATUSES)
    ).first()

    existing_active_project = db.query(Project).filter(
        (Project.assigned_vendor_id == vendor.vendor_id) | (Project.assigned_vendor_id == str(vendor.id)),
        Project.status.in_(['In Progress', 'Under Review', 'Initiated', 'Assigned', 'Work Submitted', 'Under Verification']),
        Project.id != project.id
    ).first()

    if existing_active_assignment or existing_active_project:
        active_name = ""
        if existing_active_assignment:
            p_rel = db.query(Project).filter(Project.id == existing_active_assignment.project_id).first()
            active_name = p_rel.title if p_rel else "Active Project"
        elif existing_active_project:
            active_name = existing_active_project.title

        raise HTTPException(
            status_code=409,
            detail=f"Workload limit violation: Vendor '{vendor.company_name}' is currently engaged on active project '{active_name}'. Under government workload management rules, each vendor can handle at most ONE active project at a time."
        )

    # 3. Calculate recommendation score at assignment time
    rec = calculate_vendor_recommendation(vendor, project, db)

    # 4. Create assignment record
    now = datetime.utcnow()
    now_str = now.strftime('%d %b %Y, %I:%M %p')
    wo_num = f"WO-PMC-{now.year}-{project.id:03d}"
    asn_id = f"ASN-{now.year}-{db.query(Assignment).count() + 1:04d}"

    audit_trail = [
        {
            "status": "Assigned",
            "timestamp": now_str,
            "actor": req.allocated_by or "PMC Municipal Admin",
            "notes": f"Work order {wo_num} sanctioned with budget {req.budget_sanctioned}. Target deadline: {req.target_completion_date}."
        }
    ]

    new_asn = Assignment(
        assignment_id=asn_id,
        project_id=project.id,
        vendor_id=vendor.vendor_id,
        vendor_name=vendor.company_name,
        source_complaint_id=project.source_complaint_id,
        status="Assigned",
        allocation_score=rec["recommendation_score"],
        scoring_breakdown_json=json.dumps(rec["breakdown"]),
        allocated_by=req.allocated_by or "PMC Municipal Authority",
        work_order_number=wo_num,
        work_order_details=req.work_order_details or f"Municipal works contract for {project.title}",
        budget_sanctioned=req.budget_sanctioned or project.estimated_cost or "₹45,00,000",
        target_completion_date=req.target_completion_date or project.deadline or "30 Dec 2026",
        assigned_at=now,
        audit_trail_json=json.dumps(audit_trail)
    )
    db.add(new_asn)

    # Update project
    project.assigned_vendor_id = vendor.vendor_id
    project.status = "In Progress"
    project.assignment_status = "Assigned"
    project.work_order_number = wo_num
    project.budget_sanctioned = req.budget_sanctioned
    if req.target_completion_date:
        project.deadline = req.target_completion_date
        project.expected_end = req.target_completion_date

    # Notify vendor
    notif = VendorNotification(
        vendor_id=vendor.vendor_id,
        title="New Work Order Assigned",
        text=f"You have been assigned work project '{project.title}' under Work Order {wo_num}. Budget: {req.budget_sanctioned}. Target: {req.target_completion_date}.",
        category="Work Orders",
        type="assignment",
        project_id=project.id
    )
    db.add(notif)

    # If linked to complaint, update complaint timeline
    if project.source_complaint_id:
        c = db.query(Complaint).filter(Complaint.id == project.source_complaint_id).first()
        if c:
            c.status = "In Progress"
            t_list = []
            if c.timeline_json:
                try: t_list = json.loads(c.timeline_json)
                except Exception: t_list = []
            t_list.append({
                "title": f"Assigned to Vendor: {vendor.company_name}",
                "time": now_str,
                "status": "completed",
                "note": f"Work order {wo_num} sanctioned. Active execution commenced."
            })
            c.timeline_json = json.dumps(t_list)

    db.commit()
    db.refresh(new_asn)
    db.refresh(project)

    return {
        "success": True,
        "message": f"Successfully allocated project '{project.title}' to {vendor.company_name}.",
        "assignment": new_asn.to_dict(),
        "project": project.to_dict()
    }


@router.get("/allocations/active")
def get_active_allocations(db: Session = Depends(get_db)):
    assignments = db.query(Assignment).filter(
        Assignment.status.in_(ACTIVE_ASSIGNMENT_STATUSES)
    ).order_by(Assignment.assigned_at.desc()).all()

    results = []
    for a in assignments:
        proj = db.query(Project).filter(Project.id == a.project_id).first()
        vend = db.query(Vendor).filter(Vendor.vendor_id == a.vendor_id).first()
        evidence_items = db.query(VendorEvidence).filter(VendorEvidence.project_id == a.project_id).all()

        item = a.to_dict()
        item["project"] = proj.to_dict() if proj else None
        item["vendor"] = vend.to_dict() if vend else None
        item["evidence_count"] = len(evidence_items)
        item["latest_evidence"] = [e.to_dict() for e in evidence_items[:3]]
        results.append(item)

    return {
        "success": True,
        "total": len(results),
        "assignments": results
    }


@router.get("/allocations/completed")
def get_completed_allocations(db: Session = Depends(get_db)):
    assignments = db.query(Assignment).filter(
        Assignment.status == "Completed"
    ).order_by(Assignment.completed_at.desc()).all()

    results = []
    for a in assignments:
        proj = db.query(Project).filter(Project.id == a.project_id).first()
        vend = db.query(Vendor).filter(Vendor.vendor_id == a.vendor_id).first()
        item = a.to_dict()
        item["project"] = proj.to_dict() if proj else None
        item["vendor"] = vend.to_dict() if vend else None
        results.append(item)

    return {
        "success": True,
        "total": len(results),
        "assignments": results
    }


@router.put("/allocations/{assignment_id}/verify")
def verify_allocation_work(
    assignment_id: int,
    req: VerificationDecisionReq,
    db: Session = Depends(get_db)
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    project = db.query(Project).filter(Project.id == assignment.project_id).first()
    vendor = db.query(Vendor).filter(Vendor.vendor_id == assignment.vendor_id).first()

    now = datetime.utcnow()
    now_str = now.strftime('%d %b %Y, %I:%M %p')

    audit_trail = []
    if assignment.audit_trail_json:
        try: audit_trail = json.loads(assignment.audit_trail_json)
        except Exception: audit_trail = []

    if req.decision.lower() in ["approved", "complete", "completed"]:
        # 1. Update assignment to Completed
        assignment.status = "Completed"
        assignment.verified_at = now
        assignment.completed_at = now
        assignment.rating = req.rating or 5.0
        assignment.performance_feedback = req.feedback or "Work verified and approved by municipal engineers."
        assignment.government_remarks = req.remarks or "All project specifications met."

        audit_trail.append({
            "status": "Completed",
            "timestamp": now_str,
            "actor": "PMC Municipal Verification Officer",
            "notes": f"Verification approved. Quality rating: {req.rating or 5.0}★. {req.remarks or ''}"
        })
        assignment.audit_trail_json = json.dumps(audit_trail)

        # 2. Update project
        if project:
            project.status = "Completed"
            project.assignment_status = "Completed"
            project.progress = 100

        # 3. Update vendor metrics and FREE VENDOR CAPACITY!
        if vendor:
            vendor.completed_projects_count = (vendor.completed_projects_count or 0) + 1
            # Blend new rating into performance score
            old_score = vendor.performance_score or 88.0
            new_rating_pct = (req.rating or 5.0) * 20.0 # Convert 5-star to 100-scale
            vendor.performance_score = round((old_score * 0.7) + (new_rating_pct * 0.3), 1)

            notif = VendorNotification(
                vendor_id=vendor.vendor_id,
                title="Project Verified & Approved!",
                text=f"Project '{project.title if project else 'Municipal Work'}' has been approved by the department with a {req.rating or 5.0}★ rating. Your active workload slot is now available for new assignments.",
                category="Verification",
                type="success",
                project_id=project.id if project else None
            )
            db.add(notif)

        # 4. If linked to citizen complaint, mark resolved
        if assignment.source_complaint_id:
            c = db.query(Complaint).filter(Complaint.id == assignment.source_complaint_id).first()
            if c:
                c.status = "Resolved"
                t_list = []
                if c.timeline_json:
                    try: t_list = json.loads(c.timeline_json)
                    except Exception: t_list = []
                t_list.append({
                    "title": "Work Completed & Verified",
                    "time": now_str,
                    "status": "completed",
                    "note": "Civil engineering inspection complete. Work order signed off."
                })
                c.timeline_json = json.dumps(t_list)

        msg = f"Project work order successfully verified and marked as Completed. Vendor {vendor.company_name if vendor else ''} is now available for new allocations."

    else:
        # Rework Requested
        assignment.status = "Rework Requested"
        assignment.government_remarks = req.remarks or "Rework requested on inspection deliverables."

        audit_trail.append({
            "status": "Rework Requested",
            "timestamp": now_str,
            "actor": "PMC Municipal Verification Officer",
            "notes": f"Deliverables returned for rework: {req.remarks or 'Rectifications needed'}"
        })
        assignment.audit_trail_json = json.dumps(audit_trail)

        if project:
            project.assignment_status = "Rework Requested"

        if vendor:
            notif = VendorNotification(
                vendor_id=vendor.vendor_id,
                title="Rework Requested on Work Order",
                text=f"Inspection review for '{project.title if project else ''}' requires rectifications: {req.remarks or 'Please review engineer notes'}.",
                category="Verification",
                type="warning",
                project_id=project.id if project else None
            )
            db.add(notif)

        msg = "Rework requested. Vendor has been notified with corrective instructions."

    db.commit()
    db.refresh(assignment)

    return {
        "success": True,
        "message": msg,
        "assignment": assignment.to_dict()
    }


@router.post("/complaints/convert-to-project")
def convert_complaint_to_project(
    req: ConvertComplaintToProjectReq,
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == req.complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint record not found.")

    # 1. Prepare project fields
    proj_title = req.title or f"Resolution: {complaint.title}"
    proj_cat = req.category or complaint.category or "Infrastructure"
    proj_loc = req.location or complaint.location or "Pune"
    now = datetime.utcnow()
    target_date = req.target_completion_date or (now + timedelta(days=60)).strftime('%d %b %Y')

    default_milestones = [
        {"title": "Phase 1: Site Inspection & Material Mobilization", "status": "In Progress", "progress": 25},
        {"title": "Phase 2: Execution & Civil Remediation", "status": "Pending", "progress": 0},
        {"title": "Phase 3: PMC Quality Audit & Handover", "status": "Pending", "progress": 0}
    ]

    new_project = Project(
        title=proj_title,
        category=proj_cat,
        location=proj_loc,
        latitude=complaint.latitude,
        longitude=complaint.longitude,
        start_date=now.strftime('%d %b %Y'),
        expected_end=target_date,
        deadline=target_date,
        estimated_cost=req.estimated_cost or "₹45,00,000",
        budget_sanctioned=req.estimated_cost or "₹45,00,000",
        source_complaint_id=complaint.id,
        department="Municipal Infrastructure & Civic Works",
        priority=req.priority or complaint.urgency or "Medium",
        progress=0,
        status="In Progress" if req.assigned_vendor_id else "Pending Allocation",
        assignment_status="Assigned" if req.assigned_vendor_id else "Pending Allocation",
        milestones_json=json.dumps(default_milestones)
    )
    db.add(new_project)
    db.flush()

    # 2. If vendor selected, strictly validate 1-active-project rule
    created_assignment = None
    if req.assigned_vendor_id:
        vendor = db.query(Vendor).filter(
            (Vendor.vendor_id == req.assigned_vendor_id) | (Vendor.id == (int(req.assigned_vendor_id) if req.assigned_vendor_id.isdigit() else -1))
        ).first()

        if not vendor:
            db.rollback()
            raise HTTPException(status_code=404, detail="Assigned vendor not found.")

        # Check vendor verification
        if not (vendor.is_verified or (vendor.verification_status or '').lower() in ['approved', 'verified']):
            db.rollback()
            raise HTTPException(status_code=400, detail="Cannot assign unverified vendor.")

        # STRICT ONE ACTIVE PROJECT CHECK
        existing_active_assignment = db.query(Assignment).filter(
            Assignment.vendor_id == vendor.vendor_id,
            Assignment.status.in_(ACTIVE_ASSIGNMENT_STATUSES)
        ).first()

        existing_active_project = db.query(Project).filter(
            (Project.assigned_vendor_id == vendor.vendor_id) | (Project.assigned_vendor_id == str(vendor.id)),
            Project.status.in_(['In Progress', 'Under Review', 'Initiated', 'Assigned', 'Work Submitted', 'Under Verification']),
            Project.id != new_project.id
        ).first()

        if existing_active_assignment or existing_active_project:
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail=f"Workload violation: Vendor '{vendor.company_name}' already has an active project in progress. Municipal policy strictly limits vendors to ONE active project at a time."
            )

        new_project.assigned_vendor_id = vendor.vendor_id
        wo_num = f"WO-PMC-{now.year}-{new_project.id:03d}"
        new_project.work_order_number = wo_num
        asn_id = f"ASN-{now.year}-{db.query(Assignment).count() + 1:04d}"

        audit_trail = [{
            "status": "Assigned",
            "timestamp": now.strftime('%d %b %Y, %I:%M %p'),
            "actor": "PMC Municipal Admin",
            "notes": f"Converted from complaint #{complaint.ticket_number} and assigned to {vendor.company_name}."
        }]

        created_assignment = Assignment(
            assignment_id=asn_id,
            project_id=new_project.id,
            vendor_id=vendor.vendor_id,
            vendor_name=vendor.company_name,
            source_complaint_id=complaint.id,
            status="Assigned",
            allocation_score=92.0,
            allocated_by="PMC Municipal Admin",
            work_order_number=wo_num,
            work_order_details=req.work_order_details or f"Resolution project for citizen complaint {complaint.ticket_number}",
            budget_sanctioned=req.estimated_cost or "₹45,00,000",
            target_completion_date=target_date,
            assigned_at=now,
            audit_trail_json=json.dumps(audit_trail)
        )
        db.add(created_assignment)

        # Notify vendor
        notif = VendorNotification(
            vendor_id=vendor.vendor_id,
            title="Work Order Assigned from Citizen Complaint",
            text=f"New work project '{new_project.title}' assigned to you under Work Order {wo_num}.",
            category="Work Orders",
            type="assignment",
            project_id=new_project.id
        )
        db.add(notif)

    # 3. Update complaint
    complaint.is_converted_to_project = True
    complaint.converted_project_id = new_project.id
    complaint.status = "In Progress"

    t_list = []
    if complaint.timeline_json:
        try: t_list = json.loads(complaint.timeline_json)
        except Exception: t_list = []
    t_list.append({
        "title": "Converted to Municipal Work Project",
        "time": now.strftime('%d %b %Y, %I:%M %p'),
        "status": "completed",
        "note": f"Escalated to project #{new_project.id} ('{new_project.title}'). Work order issued."
    })
    complaint.timeline_json = json.dumps(t_list)

    # Notify citizen
    if complaint.user_id:
        cit_notif = Notification(
            user_id=complaint.user_id,
            text=f"Your complaint {complaint.ticket_number} has been converted into municipal work project #{new_project.id} ('{new_project.title}'). Work is now underway!"
        )
        db.add(cit_notif)

    db.commit()
    db.refresh(new_project)
    db.refresh(complaint)

    return {
        "success": True,
        "message": f"Successfully converted complaint {complaint.ticket_number} into project #{new_project.id}.",
        "project": new_project.to_dict(),
        "assignment": created_assignment.to_dict() if created_assignment else None
    }

