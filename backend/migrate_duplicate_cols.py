"""
Database migration script to safely add duplicate complaint detection and geo columns
to existing complaints table in SQLite / PostgreSQL without losing any data.
"""

import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), "smartgov.db")
    if not os.path.exists(db_path):
        print(f"Database file not found at {db_path}. It will be created on application startup.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(complaints);")
    existing_cols = [row[1] for row in cursor.fetchall()]
    print("Existing columns in complaints:", existing_cols)

    cols_to_add = [
        ("latitude", "FLOAT"),
        ("longitude", "FLOAT"),
        ("parent_complaint_id", "INTEGER"),
        ("is_duplicate", "BOOLEAN DEFAULT 0"),
        ("duplicate_count", "INTEGER DEFAULT 0"),
        ("duplicate_reason", "VARCHAR(255)")
    ]

    for col_name, col_type in cols_to_add:
        if col_name not in existing_cols:
            print(f"Adding column '{col_name}' ({col_type}) to complaints table...")
            cursor.execute(f"ALTER TABLE complaints ADD COLUMN {col_name} {col_type};")
        else:
            print(f"Column '{col_name}' already exists.")

    conn.commit()
    conn.close()
    print("Migration completed successfully.")

if __name__ == "__main__":
    migrate()
