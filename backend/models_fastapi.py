import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from database_fastapi import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    mobile = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    location = Column(String(255), default='Kothrud, Pune, Maharashtra 411038, India')
    dob = Column(String(50), nullable=True)
    language = Column(String(50), default='English')
    email_verified = Column(Boolean, default=False)
    email_verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaints = relationship('Complaint', back_populates='user', cascade="all, delete-orphan")
    notifications = relationship('Notification', back_populates='user', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'mobile': self.mobile,
            'location': self.location,
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
    images = Column(Text, nullable=True) # JSON list of image URLs
    status = Column(String(50), default='Under Review')
    timeline_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="complaints")

    def to_dict(self):
        img_list = []
        if self.images:
            try:
                img_list = json.loads(self.images)
            except Exception:
                img_list = []

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
    progress = Column(Integer, default=0)
    status = Column(String(50), default='In Progress')
    start_date = Column(String(50), default='10 May 2024')
    expected_end = Column(String(50), default='10 Aug 2024')
    estimated_cost = Column(String(50), default='₹45,00,000')
    image = Column(Text, nullable=True)
    milestones_json = Column(Text, nullable=True)
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
            'progress': self.progress,
            'status': self.status,
            'start_date': self.start_date,
            'expected_end': self.expected_end,
            'estimated_cost': self.estimated_cost,
            'image': self.image or 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80',
            'milestones': ms_list
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
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

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
