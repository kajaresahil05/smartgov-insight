import json
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    mobile = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    location = db.Column(db.String(255), default='Kothrud, Pune, Maharashtra 411038, India')
    preferred_latitude = db.Column(db.Float, default=18.5074)
    preferred_longitude = db.Column(db.Float, default=73.8077)
    dob = db.Column(db.String(50), nullable=True)
    language = db.Column(db.String(50), default='English')
    email_verified = db.Column(db.Boolean, default=False)
    email_verified_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    complaints = db.relationship('Complaint', backref='user', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True)

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

class EmailOTP(db.Model):
    __tablename__ = 'email_otps'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    otp_hash = db.Column(db.String(255), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    attempts = db.Column(db.Integer, default=0)
    cooldown_until = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Complaint(db.Model):
    __tablename__ = 'complaints'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    ticket_number = db.Column(db.String(50), unique=True, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    urgency = db.Column(db.String(20), default='Medium')
    location = db.Column(db.String(255), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    location_accuracy = db.Column(db.Float, nullable=True)
    location_source = db.Column(db.String(50), default='manual')
    parent_complaint_id = db.Column(db.Integer, db.ForeignKey('complaints.id', ondelete='SET NULL'), nullable=True)
    is_duplicate = db.Column(db.Boolean, default=False)
    duplicate_count = db.Column(db.Integer, default=0)
    duplicate_reason = db.Column(db.String(255), nullable=True)
    images = db.Column(db.Text, nullable=True) # JSON list of image URLs
    status = db.Column(db.String(50), default='Under Review')
    timeline_json = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

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
            'images': img_list,
            'status': self.status,
            'timeline': timeline_list,
            'created_at': self.created_at.strftime('%d %b %Y, %I:%M %p') if self.created_at else ''
        }

class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'text': self.text,
            'read': self.is_read,
            'time': self.created_at.strftime('%d %b %Y, %I:%M %p') if self.created_at else 'Recently'
        }

class Project(db.Model):
    __tablename__ = 'projects'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(100), default='Road')
    location = db.Column(db.String(255), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    progress = db.Column(db.Integer, default=0)
    status = db.Column(db.String(50), default='In Progress')
    start_date = db.Column(db.String(50), default='10 May 2024')
    expected_end = db.Column(db.String(50), default='10 Aug 2024')
    estimated_cost = db.Column(db.String(50), default='₹45,00,000')
    image = db.Column(db.Text, nullable=True)
    milestones_json = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

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
            'start_date': self.start_date,
            'expected_end': self.expected_end,
            'estimated_cost': self.estimated_cost,
            'image': self.image or 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80',
            'milestones': ms_list
        }

class Vendor(db.Model):
    __tablename__ = 'vendors'

    id = db.Column(db.Integer, primary_key=True)
    vendor_id = db.Column(db.String(50), unique=True, nullable=False)
    company_name = db.Column(db.String(255), nullable=False)
    contact_person = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    mobile = db.Column(db.String(50), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    gst_number = db.Column(db.String(100), nullable=True)
    pan_number = db.Column(db.String(100), nullable=True)
    specialization = db.Column(db.String(100), default='Infrastructure')
    experience = db.Column(db.String(50), nullable=True)
    location = db.Column(db.String(255), default='Pune, Maharashtra, India')
    is_verified = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
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
            'is_verified': self.is_verified,
            'created_at': self.created_at.strftime('%d %b %Y') if self.created_at else ''
        }

