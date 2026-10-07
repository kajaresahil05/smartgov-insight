import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'smartgov.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            mobile TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            location TEXT DEFAULT 'Kothrud, Pune, Maharashtra 411038, India',
            dob TEXT,
            language TEXT DEFAULT 'English',
            avatar TEXT,
            is_verified INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # OTP Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS otps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            otp_code TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            is_used INTEGER DEFAULT 0
        )
    ''')

    # Complaints Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            ticket_number TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            location TEXT NOT NULL,
            status TEXT DEFAULT 'Under Review',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # Projects Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            location TEXT NOT NULL,
            progress INTEGER DEFAULT 0,
            status TEXT DEFAULT 'In Progress',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Seed Sample Projects if empty
    cursor.execute('SELECT COUNT(*) FROM projects')
    if cursor.fetchone()[0] == 0:
        sample_projects = [
            ('Road Repair & Resurfacing', 'Kothrud, Pune', 72, 'In Progress'),
            ('Drainage Cleaning & Maintenance', 'Warje, Pune', 40, 'In Progress'),
            ('Smart Street Light Installation', 'Karve Nagar, Pune', 100, 'Completed'),
            ('Public Park Renovation', 'Kothrud, Pune', 15, 'Initiated'),
            ('Water Pipeline Maintenance', 'Bhavani Peth, Pune', 85, 'In Progress'),
            ('CCTV Camera Surveillance Deployment', 'Deccan, Pune', 60, 'In Progress'),
            ('Solar Bus Shelter Setup', 'FC Road, Pune', 90, 'In Progress'),
            ('Waste Management Bins Installation', 'Kothrud, Pune', 100, 'Completed')
        ]
        cursor.executemany(
            'INSERT INTO projects (title, location, progress, status) VALUES (?, ?, ?, ?)',
            sample_projects
        )

    # Seed Demo Verified User if empty
    cursor.execute('SELECT COUNT(*) FROM users WHERE email = ?', ('priya@smartgov.in',))
    if cursor.fetchone()[0] == 0:
        from werkzeug.security import generate_password_hash
        pwd_hash = generate_password_hash('Password@123')
        cursor.execute('''
            INSERT INTO users (full_name, email, mobile, password_hash, location, is_verified)
            VALUES (?, ?, ?, ?, ?, 1)
        ''', ('Priya Sharma', 'priya@smartgov.in', '+91 9876543210', pwd_hash, 'Kothrud, Pune, Maharashtra 411038, India'))
        
        user_id = cursor.lastrowid
        sample_complaints = [
            (user_id, 'C-2024-101', 'Pothole on Main Paud Road near Ideal Colony', 'Road Repair', 'Kothrud, Pune', 'Under Review'),
            (user_id, 'C-2024-102', 'Street light flickering near Bus Stop #4', 'Electrical', 'Kothrud, Pune', 'Under Review'),
            (user_id, 'C-2024-098', 'Garbage collection missed on Tuesday', 'Sanitation', 'Kothrud, Pune', 'Resolved'),
            (user_id, 'C-2024-092', 'Low water pressure in Sector 3 morning supply', 'Water Supply', 'Kothrud, Pune', 'Resolved'),
            (user_id, 'C-2024-105', 'Open manhole near Municipal School', 'Safety', 'Kothrud, Pune', 'In Progress')
        ]
        cursor.executemany('''
            INSERT INTO complaints (user_id, ticket_number, title, category, location, status)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', sample_complaints)

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully!")
