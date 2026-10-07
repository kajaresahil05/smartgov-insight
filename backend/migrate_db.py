from datetime import datetime
from werkzeug.security import generate_password_hash
from app import app
from models import db, User

def migrate():
    with app.app_context():
        print("Re-creating database tables without fake sample data...")
        db.drop_all()
        db.create_all()

        print("[SUCCESS] Database tables created cleanly. Ready for real user registration & data!")

if __name__ == '__main__':
    migrate()
