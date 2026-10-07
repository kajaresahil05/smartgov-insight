import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models_fastapi import Base, User, Vendor, Project, Complaint, Notification, EmailOTP

def migrate():
    sqlite_url = "sqlite:///./smartgov.db"
    
    # The postgres URL should be set in your deployment environment (or .env)
    postgres_url = os.getenv("DATABASE_URL")
    if not postgres_url or not postgres_url.startswith("postgres"):
        print("Migration Cancelled: DATABASE_URL is not set to a valid PostgreSQL database.")
        print("Please set your environment variable. Example: postgresql://smartgov:password@localhost:5432/smartgov")
        return

    print("Connecting to local SQLite database...")
    sqlite_engine = create_engine(sqlite_url)
    SqliteSession = sessionmaker(bind=sqlite_engine)
    sqlite_db = SqliteSession()

    print("Connecting to target PostgreSQL database...")
    pg_engine = create_engine(postgres_url)
    
    print("Generating schema tables in PostgreSQL...")
    Base.metadata.create_all(pg_engine)
    
    PgSession = sessionmaker(bind=pg_engine)
    pg_db = PgSession()

    # The order of migration is important because of Foreign Key relations (e.g. Complaint requires User)
    tables_to_migrate = [
        (User, "Users"),
        (Vendor, "Vendors"),
        (Project, "Projects"),
        (Complaint, "Complaints"),
        (Notification, "Notifications"),
        (EmailOTP, "Email OTPs")
    ]

    print("\nStarting Data Transfer...")
    for model, name in tables_to_migrate:
        records_to_copy = sqlite_db.query(model).all()
        if not records_to_copy:
            print(f"[{name}] No records found. Skipping.")
            continue
            
        print(f"[{name}] Transferring {len(records_to_copy)} records...")
        for old_record in records_to_copy:
            # Create a clone of the data dictionary, removing SQLAlchemy's internal object state tracker
            record_dict = old_record.__dict__.copy()
            record_dict.pop('_sa_instance_state', None)
            
            # Instantiate the object fresh for postgres
            new_record = model(**record_dict)
            pg_db.merge(new_record) # Use merge to prevent primary key conflicts if re-running
            
        pg_db.commit()
        print(f"[{name}] Transfer Complete.")

    print("\n🚀 Migration to PostgreSQL finished successfully!")

    sqlite_db.close()
    pg_db.close()

if __name__ == "__main__":
    migrate()
