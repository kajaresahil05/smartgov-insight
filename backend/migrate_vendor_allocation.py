import sqlite3
import os
import json
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), 'smartgov.db')

def migrate_vendor_allocation():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print(f"Connecting to database at {DB_PATH}")

    # 1. Ensure 'assignments' table exists
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            assignment_id VARCHAR(50) UNIQUE NOT NULL,
            project_id INTEGER NOT NULL,
            vendor_id VARCHAR(50) NOT NULL,
            vendor_name VARCHAR(255) NOT NULL,
            source_complaint_id INTEGER,
            status VARCHAR(50) DEFAULT 'Assigned',
            allocation_score REAL DEFAULT 90.0,
            scoring_breakdown_json TEXT,
            allocated_by VARCHAR(100) DEFAULT 'PMC Municipal Authority',
            work_order_number VARCHAR(100),
            work_order_details TEXT,
            budget_sanctioned VARCHAR(100) DEFAULT '₹45,00,000',
            target_completion_date VARCHAR(100),
            assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            accepted_at DATETIME,
            submitted_at DATETIME,
            verified_at DATETIME,
            completed_at DATETIME,
            government_remarks TEXT,
            vendor_remarks TEXT,
            rating REAL,
            performance_feedback TEXT,
            audit_trail_json TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
    ''')
    print("Checked/Created 'assignments' table.")

    # 2. Add columns to 'projects' table if missing
    cursor.execute("PRAGMA table_info(projects)")
    proj_cols = [c[1] for c in cursor.fetchall()]

    new_proj_cols = {
        'source_complaint_id': 'INTEGER',
        'assignment_status': "VARCHAR(50) DEFAULT 'Pending Allocation'",
        'work_order_number': 'VARCHAR(100)',
        'budget_sanctioned': 'VARCHAR(100)'
    }
    for col, col_type in new_proj_cols.items():
        if col not in proj_cols:
            cursor.execute(f"ALTER TABLE projects ADD COLUMN {col} {col_type}")
            print(f"Added {col} to projects")

    # 3. Add columns to 'vendors' table if missing
    cursor.execute("PRAGMA table_info(vendors)")
    vendor_cols = [c[1] for c in cursor.fetchall()]

    new_vendor_cols = {
        'performance_score': 'REAL DEFAULT 88.0',
        'completed_projects_count': 'INTEGER DEFAULT 0',
        'rating': 'REAL DEFAULT 4.5'
    }
    for col, col_type in new_vendor_cols.items():
        if col not in vendor_cols:
            cursor.execute(f"ALTER TABLE vendors ADD COLUMN {col} {col_type}")
            print(f"Added {col} to vendors")

    # 4. Add columns to 'complaints' table if missing
    cursor.execute("PRAGMA table_info(complaints)")
    complaint_cols = [c[1] for c in cursor.fetchall()]

    new_complaint_cols = {
        'converted_project_id': 'INTEGER',
        'is_converted_to_project': 'BOOLEAN DEFAULT 0'
    }
    for col, col_type in new_complaint_cols.items():
        if col not in complaint_cols:
            cursor.execute(f"ALTER TABLE complaints ADD COLUMN {col} {col_type}")
            print(f"Added {col} to complaints")

    # 5. Ensure existing vendors have proper verification and scores for testing
    cursor.execute("UPDATE vendors SET is_verified = 1, verification_status = 'Approved' WHERE id IN (1, 2, 3)")
    cursor.execute("UPDATE vendors SET performance_score = 92.5, completed_projects_count = 5, rating = 4.8 WHERE id = 1") # VND-4080 Apex Infra
    cursor.execute("UPDATE vendors SET performance_score = 88.0, completed_projects_count = 3, rating = 4.5 WHERE id = 2")
    cursor.execute("UPDATE vendors SET performance_score = 84.5, completed_projects_count = 2, rating = 4.3 WHERE id = 3")

    # 6. Check existing projects & assign realistic statuses
    # Let Project 1 be assigned to VND-4080 (Apex Infra Ltd) as an active assignment to test the "One Active Project" block!
    cursor.execute("SELECT id FROM projects WHERE id = 1")
    p1 = cursor.fetchone()
    if p1:
        cursor.execute("UPDATE projects SET assigned_vendor_id = 'VND-4080', status = 'In Progress', assignment_status = 'In Progress' WHERE id = 1")
        
        # Check if assignment already exists for project 1
        cursor.execute("SELECT id FROM assignments WHERE project_id = 1")
        if not cursor.fetchone():
            now_iso = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
            audit_events = [
                {
                    "status": "Assigned",
                    "timestamp": (datetime.utcnow() - timedelta(days=10)).strftime('%d %b %Y, %I:%M %p'),
                    "actor": "PMC Municipal Admin",
                    "notes": "Work order WO-PMC-2026-081 issued to Apex Infra Ltd"
                },
                {
                    "status": "Accepted",
                    "timestamp": (datetime.utcnow() - timedelta(days=9)).strftime('%d %b %Y, %I:%M %p'),
                    "actor": "Apex Infra Ltd",
                    "notes": "Assignment accepted by vendor"
                },
                {
                    "status": "In Progress",
                    "timestamp": (datetime.utcnow() - timedelta(days=8)).strftime('%d %b %Y, %I:%M %p'),
                    "actor": "Apex Infra Ltd",
                    "notes": "Milestone phase 1 initiated"
                }
            ]
            breakdown = {
                "performance": 92.5,
                "completion_rate": 95.0,
                "category_match": 100.0,
                "capacity": 100.0,
                "experience_years": 8
            }
            cursor.execute('''
                INSERT INTO assignments (
                    assignment_id, project_id, vendor_id, vendor_name, status, allocation_score,
                    scoring_breakdown_json, allocated_by, work_order_number, work_order_details,
                    budget_sanctioned, target_completion_date, assigned_at, accepted_at, audit_trail_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                'ASN-2026-001', 1, 'VND-4080', 'Apex Infra Ltd', 'In Progress', 94.5,
                json.dumps(breakdown), 'PMC Municipal Admin', 'WO-PMC-2026-081',
                'Road Repair & Resurfacing along Paud Road corridor. Strict adherence to PMC bitumen grade specs.',
                '₹48,00,000', '15 Nov 2026', now_iso, now_iso, json.dumps(audit_events)
            ))
            print("Seeded active assignment for Project 1 -> VND-4080")

    # Project 3 was marked 'Completed' in database earlier. Let's make it a completed assignment for history!
    cursor.execute("SELECT id FROM projects WHERE id = 3")
    p3 = cursor.fetchone()
    if p3:
        cursor.execute("UPDATE projects SET assigned_vendor_id = 'VND-4544', status = 'Completed', assignment_status = 'Completed' WHERE id = 3")
        cursor.execute("SELECT id FROM assignments WHERE project_id = 3")
        if not cursor.fetchone():
            now_iso = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
            audit_events = [
                {"status": "Assigned", "timestamp": "01 Jan 2026", "actor": "PMC Admin", "notes": "Assigned to ABC Private Limited"},
                {"status": "Completed", "timestamp": "15 Feb 2026", "actor": "PMC Engineer", "notes": "Quality inspection verified. Approved."}
            ]
            cursor.execute('''
                INSERT INTO assignments (
                    assignment_id, project_id, vendor_id, vendor_name, status, allocation_score,
                    allocated_by, work_order_number, budget_sanctioned, rating, performance_feedback,
                    completed_at, audit_trail_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                'ASN-2026-002', 3, 'VND-4544', 'ABC Private Limited', 'Completed', 88.0,
                'PMC Municipal Admin', 'WO-PMC-2026-012', '₹22,50,000', 4.8,
                'Executed on time within budget. Commendable adherence to civic electrical safety guidelines.',
                now_iso, json.dumps(audit_events)
            ))
            print("Seeded completed assignment for Project 3 -> VND-4544")

    # Let Project 2, 4, 5, 6 be unassigned ('Pending Allocation') so they show up under 'Pending Work Allocation'
    cursor.execute("UPDATE projects SET assigned_vendor_id = NULL, status = 'Pending Allocation', assignment_status = 'Pending Allocation' WHERE id IN (2, 4)")
    print("Set projects 2 and 4 to Pending Allocation for testing allocation flow")

    conn.commit()
    conn.close()
    print("Vendor allocation migration complete!")

if __name__ == '__main__':
    migrate_vendor_allocation()
