import os
import sys

# Ensure backend directory is in python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import text
from app.database import engine

def run_migration():
    print(f"Connecting to database via engine: {engine.url}")
    with engine.begin() as conn:
        # Check dialect
        dialect_name = engine.dialect.name
        print(f"Dialect: {dialect_name}")
        
        # 1. Add columns if not exist
        if dialect_name == "postgresql":
            conn.execute(text("ALTER TABLE pole_capacity ADD COLUMN IF NOT EXISTS long_breadth_m DOUBLE PRECISION;"))
            conn.execute(text("ALTER TABLE pole_capacity ADD COLUMN IF NOT EXISTS long_breadth_m_unit VARCHAR;"))
        else:
            # SQLite fallback
            try:
                conn.execute(text("ALTER TABLE pole_capacity ADD COLUMN long_breadth_m FLOAT;"))
            except Exception as e:
                print("Column long_breadth_m may already exist in SQLite:", e)
            try:
                conn.execute(text("ALTER TABLE pole_capacity ADD COLUMN long_breadth_m_unit VARCHAR;"))
            except Exception as e:
                print("Column long_breadth_m_unit may already exist in SQLite:", e)
        
        # 2. Populate values
        # Unit
        conn.execute(text("UPDATE pole_capacity SET long_breadth_m_unit = 'm' WHERE long_breadth_m_unit IS NULL;"))
        
        # 11m single pole
        conn.execute(text("""
            UPDATE pole_capacity 
            SET long_breadth_m = 0.388 
            WHERE height_m = 11 AND (class_label NOT LIKE '2x%' AND class_label NOT LIKE '2X%') AND long_breadth_m IS NULL;
        """))
        
        # 11m double pole
        conn.execute(text("""
            UPDATE pole_capacity 
            SET long_breadth_m = 0.776 
            WHERE height_m = 11 AND (class_label LIKE '2x%' OR class_label LIKE '2X%') AND long_breadth_m IS NULL;
        """))
        
        # 9m single pole
        conn.execute(text("""
            UPDATE pole_capacity 
            SET long_breadth_m = 0.320 
            WHERE height_m = 9 AND (class_label NOT LIKE '2x%' AND class_label NOT LIKE '2X%') AND long_breadth_m IS NULL;
        """))
        
        # 9m double pole
        conn.execute(text("""
            UPDATE pole_capacity 
            SET long_breadth_m = 0.640 
            WHERE height_m = 9 AND (class_label LIKE '2x%' OR class_label LIKE '2X%') AND long_breadth_m IS NULL;
        """))
        
        # 13m single pole
        conn.execute(text("""
            UPDATE pole_capacity 
            SET long_breadth_m = 0.450 
            WHERE height_m = 13 AND (class_label NOT LIKE '2x%' AND class_label NOT LIKE '2X%') AND long_breadth_m IS NULL;
        """))
        
        # 13m double pole
        conn.execute(text("""
            UPDATE pole_capacity 
            SET long_breadth_m = 0.900 
            WHERE height_m = 13 AND (class_label LIKE '2x%' OR class_label LIKE '2X%') AND long_breadth_m IS NULL;
        """))
        
        # Fallback for any remaining nulls
        conn.execute(text("""
            UPDATE pole_capacity 
            SET long_breadth_m = COALESCE(avg_breadth_m, 0.388) 
            WHERE long_breadth_m IS NULL;
        """))
        
        # Also ensure avg_breadth_m is populated
        conn.execute(text("""
            UPDATE pole_capacity 
            SET avg_breadth_m = 0.280, avg_breadth_m_unit = 'm' 
            WHERE avg_breadth_m IS NULL;
        """))
        
        print("Migration queries applied successfully.")
        
        # Check sample rows
        result = conn.execute(text("SELECT id, height_m, class_label, avg_breadth_m, long_breadth_m FROM pole_capacity LIMIT 5;"))
        rows = result.fetchall()
        print("Sample rows after migration:")
        for r in rows:
            print(" ", r)

if __name__ == "__main__":
    run_migration()
