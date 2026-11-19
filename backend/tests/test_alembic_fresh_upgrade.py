"""Test proving that a completely fresh, empty database upgrades cleanly to head via Alembic."""
import os
import sqlite3
import tempfile
import pytest
from alembic.config import Config
from alembic import command


def test_fresh_database_upgrades_cleanly_to_head():
    """Verify that a brand new empty database runs all migrations to head without errors."""
    temp_dir = tempfile.mkdtemp(prefix="alembic_fresh_")
    fresh_db = os.path.join(temp_dir, "fresh_empty.db")
    db_url = f"sqlite:///{fresh_db.replace(os.sep, '/')}"

    ini_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../alembic.ini"))
    alembic_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../alembic"))
    versions_dir = os.path.abspath(os.path.join(alembic_dir, "versions"))

    cfg = Config(ini_path)
    cfg.set_main_option("script_location", alembic_dir)
    cfg.set_main_option("version_locations", versions_dir)
    cfg.set_main_option("sqlalchemy.url", db_url)

    # 1. Execute upgrade from scratch to head on a fresh blank database
    command.upgrade(cfg, "head")

    # 2. Verify tables and columns created
    conn = sqlite3.connect(fresh_db)
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(project)")
    columns = [row[1] for row in cursor.fetchall()]

    assert "attachment_height_below_pole_top_m" in columns, "Missing attachment_height_below_pole_top_m in project"
    assert "vertical_spacing_11kv_lv_m" in columns, "Missing vertical_spacing_11kv_lv_m in project"
    assert "terrain_height_m" in columns, "Missing terrain_height_m in project"

    # 3. Test downgrade one step
    command.downgrade(cfg, "-1")
    cursor.execute("PRAGMA table_info(project)")
    downgraded_columns = [row[1] for row in cursor.fetchall()]
    assert "terrain_height_m" not in downgraded_columns

    # 4. Re-upgrade cleanly back to head
    command.upgrade(cfg, "head")
    cursor.execute("PRAGMA table_info(project)")
    re_upgraded_columns = [row[1] for row in cursor.fetchall()]
    assert "terrain_height_m" in re_upgraded_columns

    conn.close()
    try:
        os.remove(fresh_db)
        os.rmdir(temp_dir)
    except Exception:
        pass
