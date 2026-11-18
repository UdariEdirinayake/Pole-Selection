"""CLI tool for initialising the first administrator account.

Usage:
    ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=<strong-secret> python -m app.cli_init_admin

All credentials MUST be provided via environment variables — no password
literals exist in this file or anywhere else in the repository.
"""

import os
import sys
from app.database import SessionLocal
from app.models import User
from app.auth import hash_password


def init_admin():
    admin_email = os.getenv("ADMIN_EMAIL", "").strip().lower()
    admin_password = os.getenv("ADMIN_PASSWORD", "").strip()
    admin_role = os.getenv("ADMIN_ROLE", "admin")

    if not admin_email:
        print("ERROR: ADMIN_EMAIL environment variable is required.")
        print("  Example: ADMIN_EMAIL=admin@pole-select.local ADMIN_PASSWORD=YourStrongPass python -m app.cli_init_admin")
        sys.exit(1)

    if not admin_password:
        print("ERROR: ADMIN_PASSWORD environment variable is required.")
        print("  No default password is embedded in the code for security reasons.")
        sys.exit(1)

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
        db.commit()
        print(f"Successfully initialized admin user: {admin_email} (role: {admin_role})")
        print()
        print("To create additional users (designer, reviewer), run this script again")
        print("with the desired ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_ROLE values.")
    except Exception as e:
        db.rollback()
        print(f"Error initializing user: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    init_admin()
