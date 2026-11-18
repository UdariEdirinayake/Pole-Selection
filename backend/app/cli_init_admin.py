import os
import sys
from app.database import SessionLocal
from app.models import User
from app.auth import hash_password


def init_admin():
    admin_email = os.getenv("ADMIN_EMAIL", "admin@pole-select.local").lower()
    admin_password = os.getenv("ADMIN_PASSWORD", "AdminPass123!")
    admin_role = os.getenv("ADMIN_ROLE", "admin")

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == admin_email).first()
        if existing:
            print(f"Admin user already exists: {existing.email} (role: {existing.role})")
            return

        user = User(
            email=admin_email,
            password_hash=hash_password(admin_password),
            role=admin_role,
            active=True,
        )
        db.add(user)

        # Also create a default designer and reviewer for local testing if not exist
        designer_email = "designer@pole-select.local"
        if not db.query(User).filter(User.email == designer_email).first():
            db.add(User(
                email=designer_email,
                password_hash=hash_password("DesignerPass123!"),
                role="designer",
                active=True
            ))

        reviewer_email = "reviewer@pole-select.local"
        if not db.query(User).filter(User.email == reviewer_email).first():
            db.add(User(
                email=reviewer_email,
                password_hash=hash_password("ReviewerPass123!"),
                role="reviewer",
                active=True
            ))

        db.commit()
        print(f"Successfully initialized admin user: {admin_email}")
        print("Default test users initialized:")
        print(f"  - {admin_email} (admin)")
        print(f"  - {designer_email} (designer)")
        print(f"  - {reviewer_email} (reviewer)")
    except Exception as e:
        db.rollback()
        print(f"Error initializing users: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    init_admin()
