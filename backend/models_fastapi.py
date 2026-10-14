import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from database_fastapi import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    mobile = Column(String(50), nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    location = Column(String(255), default='Kothrud, Pune, Maharashtra 411038, India')
    preferred_latitude = Column(Float, default=18.5074)
    preferred_longitude = Column(Float, default=73.8077)
    dob = Column(String(50), nullable=True)
    language = Column(String(50), default='English')
    email_verified = Column(Boolean, default=False)
    email_verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaints = relationship('Complaint', back_populates='user', cascade="all, delete-orphan", foreign_keys="Complaint.user_id")
    notifications = relationship('Notification', back_populates='user', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'mobile': self.mobile,
            'location': self.location,
            'preferred_latitude': self.preferred_latitude,
            'preferred_longitude': self.preferred_longitude,
            'dob': self.dob,
            'language': self.language,
            'email_verified': self.email_verified,
            'email_verified_at': self.email_verified_at.isoformat() if self.email_verified_at else None
        }

class EmailOTP(Base):
    __tablename__ = 'email_otps'

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    otp_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, default=0)
    cooldown_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Complaint(Base):
    __tablename__ = 'complaints'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    ticket_number = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    urgency = Column(String(20), default='Medium')
    location = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_accuracy = Column(Float, nullable=True)
    location_source = Column(String(50), default='manual')
    parent_complaint_id = Column(Integer, ForeignKey('complaints.id', ondelete='SET NULL'), nullable=True)
    is_duplicate = Column(Boolean, default=False)
    duplicate_count = Column(Integer, default=0)
    duplicate_reason = Column(String(255), nullable=True)
    images = Column(Text, nullable=True) # JSON list of image URLs
    status = Column(String(50), default='Under Review')
    converted_project_id = Column(Integer, nullable=True)
    is_converted_to_project = Column(Boolean, default=False)
    timeline_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="complaints", foreign_keys=[user_id])

    def to_dict(self):
        img_list = []
        if self.images:
            try:
                img_list = json.loads(self.images)
            except Exception:
                img_list = [self.images]

        timeline_list = []
        if self.timeline_json:
            try:
                timeline_list = json.loads(self.timeline_json)
            except Exception:
                timeline_list = []

        return {
            'id': self.id,
            'user_id': self.user_id,
            'ticket_number': self.ticket_number,
            'title': self.title,
            'category': self.category,
            'description': self.description or '',
            'urgency': self.urgency or 'Medium',
            'location': self.location,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'location_accuracy': self.location_accuracy,
            'location_source': self.location_source or 'manual',
            'parent_complaint_id': self.parent_complaint_id,
            'is_duplicate': bool(self.is_duplicate),
            'duplicate_count': self.duplicate_count or 0,
            'duplicate_reason': self.duplicate_reason or '',
            'converted_project_id': self.converted_project_id,
            'is_converted_to_project': bool(self.is_converted_to_project),
            'images': img_list,
            'status': self.status,
            'timeline': timeline_list,
            'created_at': self.created_at.strftime('%d %b %Y, %I:%M %p') if self.created_at else ''
        }

class Notification(Base):
    __tablename__ = 'notifications'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    text = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'text': self.text,
            'read': self.is_read,
            'time': self.created_at.strftime('%d %b %Y, %I:%M %p') if self.created_at else 'Recently'
        }

class Project(Base):
    __tablename__ = 'projects'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default='Road')
    location = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    progress = Column(Integer, default=0)
    status = Column(String(50), default='In Progress')
    assignment_status = Column(String(50), default='Pending Allocation')
    source_complaint_id = Column(Integer, nullable=True)
    start_date = Column(String(50), default='10 May 2024')
    expected_end = Column(String(50), default='10 Aug 2024')
    estimated_cost = Column(String(50), default='₹45,00,000')
    budget_sanctioned = Column(String(100), nullable=True)
    work_order_number = Column(String(100), nullable=True)
    image = Column(Text, nullable=True)
    milestones_json = Column(Text, nullable=True)
    assigned_vendor_id = Column(String(50), nullable=True, index=True)
    department = Column(String(100), default='Infrastructure & Public Works')
    priority = Column(String(20), default='Medium')
    deadline = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        ms_list = []
        if self.milestones_json:
            try:
                ms_list = json.loads(self.milestones_json)
            except Exception:
                ms_list = []

        return {
            'id': self.id,
            'title': self.title,
            'category': self.category or 'Road',
            'location': self.location,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'progress': self.progress,
            'status': self.status,
            'assignment_status': self.assignment_status or ('Assigned' if self.assigned_vendor_id else 'Pending Allocation'),
            'source_complaint_id': self.source_complaint_id,
            'start_date': self.start_date,
            'expected_end': self.expected_end,
            'estimated_cost': self.estimated_cost,
            'budget_sanctioned': self.budget_sanctioned or self.estimated_cost,
            'work_order_number': self.work_order_number,
            'assigned_vendor_id': self.assigned_vendor_id,
            'department': self.department or 'Infrastructure & Public Works',
            'priority': self.priority or 'Medium',
            'deadline': self.deadline or self.expected_end or '15 Mar 2027',
            'image': self.image or 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80',
            'milestones': ms_list
        }

class Assignment(Base):
    __tablename__ = 'assignments'

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(String(50), unique=True, nullable=False, index=True)
    project_id = Column(Integer, ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    vendor_id = Column(String(50), nullable=False, index=True)
    vendor_name = Column(String(255), nullable=False)
    source_complaint_id = Column(Integer, nullable=True)
    status = Column(String(50), default='Assigned')
    allocation_score = Column(Float, default=90.0)
    scoring_breakdown_json = Column(Text, nullable=True)
    allocated_by = Column(String(100), default='PMC Municipal Authority')
    work_order_number = Column(String(100), nullable=True)
    work_order_details = Column(Text, nullable=True)
    budget_sanctioned = Column(String(100), default='₹45,00,000')
    target_completion_date = Column(String(100), nullable=True)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    government_remarks = Column(Text, nullable=True)
    vendor_remarks = Column(Text, nullable=True)
    rating = Column(Float, nullable=True)
    performance_feedback = Column(Text, nullable=True)
    audit_trail_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        breakdown = {}
        if self.scoring_breakdown_json:
            try:
                breakdown = json.loads(self.scoring_breakdown_json)
            except Exception:
                breakdown = {}

        audit_trail = []
        if self.audit_trail_json:
            try:
                audit_trail = json.loads(self.audit_trail_json)
            except Exception:
                audit_trail = []

        return {
            'id': self.id,
            'assignment_id': self.assignment_id,
            'project_id': self.project_id,
            'vendor_id': self.vendor_id,
            'vendor_name': self.vendor_name,
            'source_complaint_id': self.source_complaint_id,
            'status': self.status,
            'allocation_score': self.allocation_score or 0.0,
            'scoring_breakdown': breakdown,
            'allocated_by': self.allocated_by or 'PMC Municipal Authority',
            'work_order_number': self.work_order_number or f"WO-PMC-{self.id:04d}",
            'work_order_details': self.work_order_details or '',
            'budget_sanctioned': self.budget_sanctioned or '₹45,00,000',
            'target_completion_date': self.target_completion_date or '',
            'assigned_at': self.assigned_at.strftime('%d %b %Y, %I:%M %p') if self.assigned_at else '',
            'accepted_at': self.accepted_at.strftime('%d %b %Y, %I:%M %p') if self.accepted_at else None,
            'submitted_at': self.submitted_at.strftime('%d %b %Y, %I:%M %p') if self.submitted_at else None,
            'verified_at': self.verified_at.strftime('%d %b %Y, %I:%M %p') if self.verified_at else None,
            'completed_at': self.completed_at.strftime('%d %b %Y, %I:%M %p') if self.completed_at else None,
            'government_remarks': self.government_remarks or '',
            'vendor_remarks': self.vendor_remarks or '',
            'rating': self.rating,
            'performance_feedback': self.performance_feedback or '',
            'audit_trail': audit_trail,
            'created_at': self.created_at.strftime('%d %b %Y') if self.created_at else ''
        }

class Vendor(Base):
    __tablename__ = 'vendors'

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(String(50), unique=True, nullable=False, index=True)
    company_name = Column(String(255), nullable=False)
    contact_person = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    mobile = Column(String(50), nullable=False)
    password_hash = Column(String(255), nullable=False)
    gst_number = Column(String(100), nullable=True)
    pan_number = Column(String(100), nullable=True)
    specialization = Column(String(100), default='Infrastructure')
    experience = Column(String(50), nullable=True)
    location = Column(String(255), default='Pune, Maharashtra, India')
    business_address = Column(String(255), nullable=True)
    city = Column(String(100), default='Pune')
    state = Column(String(100), default='Maharashtra')
    pincode = Column(String(20), default='411038')
    bank_name = Column(String(100), nullable=True)
    account_number = Column(String(100), nullable=True)
    ifsc_code = Column(String(50), nullable=True)
    branch_name = Column(String(100), nullable=True)
    is_verified = Column(Boolean, default=True)
    verification_status = Column(String(50), default='Pending Review')
    documents_json = Column(Text, nullable=True)
    settings_json = Column(Text, nullable=True)
    performance_score = Column(Float, default=88.0)
    completed_projects_count = Column(Integer, default=0)
    rating = Column(Float, default=4.5)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        docs = []
        if self.documents_json:
            try:
                docs = json.loads(self.documents_json)
            except Exception:
                docs = []

        settings = {
            'email_notifications': True,
            'milestone_reminders': True,
            'performance_alerts': True,
            'dark_mode': False
        }
        if self.settings_json:
            try:
                settings.update(json.loads(self.settings_json))
            except Exception:
                pass

        # Calculate profile completion percentage based on core fields
        fields_to_check = [
            self.company_name, self.contact_person, self.email, self.mobile,
            self.gst_number, self.pan_number, self.specialization, self.experience,
            self.business_address, self.city, self.bank_name, self.account_number, self.ifsc_code
        ]
        filled_count = sum(1 for f in fields_to_check if f and str(f).strip())
        completion_pct = int((filled_count / len(fields_to_check)) * 100)

        return {
            'id': self.id,
            'vendor_id': self.vendor_id,
            'company_name': self.company_name,
            'contact_person': self.contact_person,
            'email': self.email,
            'mobile': self.mobile,
            'gst_number': self.gst_number,
            'pan_number': self.pan_number,
            'specialization': self.specialization,
            'experience': self.experience,
            'location': self.location,
            'business_address': self.business_address or '',
            'city': self.city or 'Pune',
            'state': self.state or 'Maharashtra',
            'pincode': self.pincode or '411038',
            'bank_name': self.bank_name or '',
            'account_number': self.account_number or '',
            'ifsc_code': self.ifsc_code or '',
            'branch_name': self.branch_name or '',
            'is_verified': self.is_verified,
            'verification_status': self.verification_status or ('Verified' if self.is_verified else 'Pending Review'),
            'performance_score': self.performance_score or 85.0,
            'completed_projects_count': self.completed_projects_count or 0,
            'rating': self.rating or 4.5,
            'documents': docs,
            'settings': settings,
            'profile_completion_pct': completion_pct,
            'created_at': self.created_at.strftime('%d %b %Y') if self.created_at else ''
        }

class VendorMilestoneUpdate(Base):
    __tablename__ = 'vendor_milestone_updates'

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    vendor_id = Column(String(50), nullable=False, index=True)
    milestone_index = Column(Integer, default=0)
    milestone_title = Column(String(255), nullable=False)
    progress = Column(Integer, default=0)
    status = Column(String(50), default='Pending')
    remarks = Column(Text, nullable=True)
    reviewer_feedback = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'vendor_id': self.vendor_id,
            'milestone_index': self.milestone_index,
            'milestone_title': self.milestone_title,
            'progress': self.progress,
            'status': self.status,
            'remarks': self.remarks,
            'reviewer_feedback': self.reviewer_feedback,
            'submitted_at': self.submitted_at.strftime('%d %b %Y %H:%M') if self.submitted_at else ''
        }

class VendorEvidence(Base):
    __tablename__ = 'vendor_evidence'

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(String(50), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    milestone_title = Column(String(255), nullable=True)
    filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    file_type = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), default='Under Review')
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        # Format size in KB or MB
        size_str = '0 KB'
        if self.file_size:
            if self.file_size >= 1024 * 1024:
                size_str = f"{self.file_size / (1024 * 1024):.1f} MB"
            else:
                size_str = f"{max(1, self.file_size // 1024)} KB"

        return {
            'id': self.id,
            'vendor_id': self.vendor_id,
            'project_id': self.project_id,
            'milestone_title': self.milestone_title or 'General',
            'filename': self.filename,
            'file_size': self.file_size,
            'file_size_formatted': size_str,
            'file_type': self.file_type,
            'description': self.description or '',
            'status': self.status,
            'uploaded_at': self.uploaded_at.strftime('%d %b %Y') if self.uploaded_at else ''
        }

class VendorNotification(Base):
    __tablename__ = 'vendor_notifications'

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(String(50), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    text = Column(Text, nullable=False)
    category = Column(String(50), default='General')
    type = Column(String(20), default='info')
    project_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'vendor_id': self.vendor_id,
            'title': self.title,
            'text': self.text,
            'category': self.category,
            'type': self.type,
            'project_id': self.project_id,
            'is_read': self.is_read,
            'created_at': self.created_at.strftime('%d %b %Y %H:%M') if self.created_at else ''
        }

