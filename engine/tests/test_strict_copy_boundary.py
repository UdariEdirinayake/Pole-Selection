import os
import re
import pytest

def test_no_copied_data_tables_in_pole_engine():
    """
    STRICT COPY BOUNDARY TEST:
    Scans engine/pole_engine for any copied data tables from the original tool:
    - NOMINAL pole rating maps
    - BUCKLING capacity dictionaries
    - BREADTH pole shaft dimension maps
    - unitWeight hard-coded conductor weight maps
    All data must strictly come from master-data tables or explicit project inputs.
    """
    forbidden_patterns = [
        (r'\bNOMINAL\s*=\s*\{', 'NOMINAL dictionary table'),
        (r'\bBUCKLING\s*=\s*\{', 'BUCKLING dictionary table'),
        (r'\bBREADTH\s*=\s*\{', 'BREADTH dictionary table'),
        (r'\{\s*1\s*:\s*1\.056', 'unitWeight hardcoded map table'),
        (r'\bNOMINAL\[', 'NOMINAL lookup'),
        (r'\bBUCKLING\[', 'BUCKLING lookup'),
        (r'\bBREADTH\[', 'BREADTH lookup'),
    ]

    engine_dir = os.path.join(os.path.dirname(__file__), "..", "pole_engine")
    violations = []

    for root, _, files in os.walk(engine_dir):
        for f in files:
            if f.endswith(".py"):
                file_path = os.path.join(root, f)
                with open(file_path, "r", encoding="utf-8") as src:
                    content = src.read()
                    for pattern, desc in forbidden_patterns:
                        if re.search(pattern, content):
                            violations.append((file_path, desc))

    assert not violations, f"Forbidden copied data tables found in engine/pole_engine:\n{violations}"
