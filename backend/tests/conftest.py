"""Root conftest — sets environment variables and configures an isolated temporary database.
Tests NEVER use backend/pole_select.db.
"""
import os
import shutil
import tempfile
import pytest
from sqlalchemy import create_engine

# TESTING=1 enables test-only endpoints
os.environ["TESTING"] = "1"

# Prepare temporary database directory and file
temp_dir = tempfile.mkdtemp(prefix="pole_select_test_")
temp_db_file = os.path.join(temp_dir, "test_pole_select.db")
PROD_DB_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../pole_select.db"))

if os.path.exists(PROD_DB_FILE):
    shutil.copy2(PROD_DB_FILE, temp_db_file)

temp_db_url = f"sqlite:///{temp_db_file.replace(chr(92), '/')}"
os.environ["DATABASE_URL"] = temp_db_url

from app.config import settings
settings.DATABASE_URL = temp_db_url

from app import database
database.engine = create_engine(temp_db_url, connect_args={"check_same_thread": False}, echo=False)
database.SessionLocal.configure(bind=database.engine)


@pytest.fixture(scope="session", autouse=True)
def ensure_temp_db_isolation():
    """Ensure tests run against temporary database and clean up afterward."""
    # Verify we are NOT using the production DB file
    assert "test_pole_select.db" in settings.DATABASE_URL
    assert os.path.abspath(temp_db_file) != PROD_DB_FILE
    yield
    database.engine.dispose()
    try:
        shutil.rmtree(temp_dir, ignore_errors=True)
    except Exception:
        pass
