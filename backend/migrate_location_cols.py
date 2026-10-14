import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'smartgov.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Update complaints table
    cursor.execute("PRAGMA table_info(complaints)")
    complaint_cols = [c[1] for c in cursor.fetchall()]
    
    if 'location_accuracy' not in complaint_cols:
        cursor.execute("ALTER TABLE complaints ADD COLUMN location_accuracy REAL")
        print("Added location_accuracy to complaints")
    
    if 'location_source' not in complaint_cols:
        cursor.execute("ALTER TABLE complaints ADD COLUMN location_source VARCHAR(50) DEFAULT 'manual'")
        print("Added location_source to complaints")

    # 2. Update projects table
    cursor.execute("PRAGMA table_info(projects)")
    project_cols = [c[1] for c in cursor.fetchall()]
    
    if 'latitude' not in project_cols:
        cursor.execute("ALTER TABLE projects ADD COLUMN latitude REAL")
        print("Added latitude to projects")
    
    if 'longitude' not in project_cols:
        cursor.execute("ALTER TABLE projects ADD COLUMN longitude REAL")
        print("Added longitude to projects")

    # 3. Update users table
    cursor.execute("PRAGMA table_info(users)")
    user_cols = [c[1] for c in cursor.fetchall()]
    
    if 'preferred_latitude' not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN preferred_latitude REAL DEFAULT 18.5074")
        print("Added preferred_latitude to users")
        
    if 'preferred_longitude' not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN preferred_longitude REAL DEFAULT 73.8077")
        print("Added preferred_longitude to users")

    # Update existing users with default coordinates if null
    cursor.execute("UPDATE users SET preferred_latitude = 18.5074 WHERE preferred_latitude IS NULL")
    cursor.execute("UPDATE users SET preferred_longitude = 73.8077 WHERE preferred_longitude IS NULL")

    # 4. Populate realistic civic projects if projects table is empty
    cursor.execute("SELECT COUNT(*) FROM projects")
    count = cursor.fetchone()[0]
    if count == 0:
        sample_projects = [
            (
                'Road Repair & Resurfacing - Paud Road Corridor',
                'Road',
                'Paud Road, Kothrud, Pune',
                72,
                'In Progress',
                '15 Jan 2024',
                '30 May 2024',
                '₹45,00,000',
                'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80',
                json.dumps([
                    {"title": "Survey & Utility Relocation", "status": "Completed", "date": "Jan 2024"},
                    {"title": "Bitumen Resurfacing", "status": "In Progress", "date": "Apr 2024"},
                    {"title": "Thermoplastic Lane Markings", "status": "Pending", "date": "May 2024"}
                ]),
                18.5085,
                73.8090
            ),
            (
                'Smart Stormwater Drainage & Culvert Upgrade',
                'Drainage',
                'Warje Malwadi, Pune',
                45,
                'In Progress',
                '01 Feb 2024',
                '15 Jul 2024',
                '₹28,50,000',
                'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=400&q=80',
                json.dumps([
                    {"title": "Excavation & Culvert Laying", "status": "Completed", "date": "Feb 2024"},
                    {"title": "Silt Trap Integration", "status": "In Progress", "date": "May 2024"},
                    {"title": "Surface Restoration", "status": "Pending", "date": "Jul 2024"}
                ]),
                18.4980,
                73.8020
            ),
            (
                'Solar Powered LED Smart Streetlight Network',
                'Others',
                'Karve Nagar Chowk, Pune',
                100,
                'Completed',
                '10 Dec 2023',
                '28 Feb 2024',
                '₹18,00,000',
                'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=400&q=80',
                json.dumps([
                    {"title": "Pole Wiring & PV Install", "status": "Completed", "date": "Dec 2023"},
                    {"title": "Smart Luminaire Commissioning", "status": "Completed", "date": "Jan 2024"},
                    {"title": "Central Monitoring Online", "status": "Completed", "date": "Feb 2024"}
                ]),
                18.4910,
                73.8180
            ),
            (
                'Public Bio-Diversity Park & Community Walking Track',
                'Others',
                'Mayur Colony, Kothrud, Pune',
                25,
                'Initiated',
                '01 Mar 2024',
                '30 Oct 2024',
                '₹35,00,000',
                'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=400&q=80',
                json.dumps([
                    {"title": "Perimeter Fencing & Soil Grading", "status": "Completed", "date": "Mar 2024"},
                    {"title": "Walkway Paving & Irrigation", "status": "In Progress", "date": "Jun 2024"},
                    {"title": "Tree Plantation & Gazebos", "status": "Pending", "date": "Oct 2024"}
                ]),
                18.5130,
                73.8140
            ),
            (
                'Municipal Water Pipeline Infrastructure Renewal',
                'Water',
                'FC Road, Deccan Gymkhana, Pune',
                85,
                'In Progress',
                '05 Jan 2024',
                '20 May 2024',
                '₹52,00,000',
                'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=400&q=80',
                json.dumps([
                    {"title": "Ductile Iron Pipe Laying", "status": "Completed", "date": "Jan 2024"},
                    {"title": "Pressure Testing & Leak Check", "status": "Completed", "date": "Mar 2024"},
                    {"title": "Domestic Connection Hookup", "status": "In Progress", "date": "May 2024"}
                ]),
                18.5175,
                73.8410
            ),
            (
                'Intelligent Traffic Flow Optimization Sensors',
                'Road',
                'Shivajinagar Interchange, Pune',
                65,
                'In Progress',
                '20 Feb 2024',
                '15 Aug 2024',
                '₹60,00,000',
                'https://images.unsplash.com/photo-1494783367193-149034c05e8f?auto=format&fit=crop&w=400&q=80',
                json.dumps([
                    {"title": "Radar & Camera Mounting", "status": "Completed", "date": "Mar 2024"},
                    {"title": "SCATS Controller Synchronization", "status": "In Progress", "date": "May 2024"},
                    {"title": "Real-time Public Signage Live", "status": "Pending", "date": "Aug 2024"}
                ]),
                18.5280,
                73.8440
            )
        ]
        
        cursor.executemany('''
            INSERT INTO projects (
                title, category, location, progress, status, start_date, expected_end,
                estimated_cost, image, milestones_json, latitude, longitude
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', sample_projects)
        print(f"Seeded {len(sample_projects)} projects with real coordinates and milestones")

    conn.commit()
    conn.close()
    print("Migration completed successfully!")

if __name__ == '__main__':
    migrate()
