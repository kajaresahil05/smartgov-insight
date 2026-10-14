import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'smartgov.db')

def migrate_vendor_tables():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Update projects table
    cursor.execute("PRAGMA table_info(projects)")
    project_cols = [c[1] for c in cursor.fetchall()]

    if 'assigned_vendor_id' not in project_cols:
        cursor.execute("ALTER TABLE projects ADD COLUMN assigned_vendor_id VARCHAR(50)")
        print("Added assigned_vendor_id to projects")

    if 'department' not in project_cols:
        cursor.execute("ALTER TABLE projects ADD COLUMN department VARCHAR(100) DEFAULT 'Infrastructure & Public Works'")
        print("Added department to projects")

    if 'priority' not in project_cols:
        cursor.execute("ALTER TABLE projects ADD COLUMN priority VARCHAR(20) DEFAULT 'Medium'")
        print("Added priority to projects")

    if 'deadline' not in project_cols:
        cursor.execute("ALTER TABLE projects ADD COLUMN deadline VARCHAR(50)")
        print("Added deadline to projects")

    # Sync deadline with expected_end if deadline is null
    cursor.execute("UPDATE projects SET deadline = expected_end WHERE deadline IS NULL AND expected_end IS NOT NULL")

    # 2. Update vendors table
    cursor.execute("PRAGMA table_info(vendors)")
    vendor_cols = [c[1] for c in cursor.fetchall()]

    new_vendor_cols = {
        'business_address': "VARCHAR(255)",
        'city': "VARCHAR(100) DEFAULT 'Pune'",
        'state': "VARCHAR(100) DEFAULT 'Maharashtra'",
        'pincode': "VARCHAR(20) DEFAULT '411038'",
        'bank_name': "VARCHAR(100)",
        'account_number': "VARCHAR(100)",
        'ifsc_code': "VARCHAR(50)",
        'branch_name': "VARCHAR(100)",
        'verification_status': "VARCHAR(50) DEFAULT 'Pending Review'",
        'documents_json': "TEXT",
        'settings_json': "TEXT"
    }

    for col_name, col_type in new_vendor_cols.items():
        if col_name not in vendor_cols:
            cursor.execute(f"ALTER TABLE vendors ADD COLUMN {col_name} {col_type}")
            print(f"Added {col_name} to vendors")

    # Update verification_status based on is_verified for existing rows
    cursor.execute("UPDATE vendors SET verification_status = CASE WHEN is_verified = 1 THEN 'Verified' ELSE 'Pending Review' END WHERE verification_status IS NULL")

    # 3. Create vendor_milestone_updates table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vendor_milestone_updates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            vendor_id VARCHAR(50) NOT NULL,
            milestone_index INTEGER DEFAULT 0,
            milestone_title VARCHAR(255) NOT NULL,
            progress INTEGER DEFAULT 0,
            status VARCHAR(50) DEFAULT 'Pending',
            remarks TEXT,
            reviewer_feedback TEXT,
            submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    ''')
    print("Ensured vendor_milestone_updates table exists")

    # 4. Create vendor_evidence table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vendor_evidence (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vendor_id VARCHAR(50) NOT NULL,
            project_id INTEGER NOT NULL,
            milestone_title VARCHAR(255),
            filename VARCHAR(255) NOT NULL,
            stored_filename VARCHAR(255) NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            file_size INTEGER DEFAULT 0,
            file_type VARCHAR(100),
            description TEXT,
            status VARCHAR(50) DEFAULT 'Under Review',
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    ''')
    print("Ensured vendor_evidence table exists")

    # 5. Create vendor_notifications table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vendor_notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vendor_id VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            text TEXT NOT NULL,
            category VARCHAR(50) DEFAULT 'General',
            type VARCHAR(20) DEFAULT 'info',
            project_id INTEGER,
            is_read BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    print("Ensured vendor_notifications table exists")

    conn.commit()
    conn.close()
    print("Vendor migration completed successfully!")

if __name__ == '__main__':
    migrate_vendor_tables()
