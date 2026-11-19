import os
import re
import pytest

def test_no_todo_in_calc_coverage():
    """
    Test that docs/calc_coverage.md has no remaining 'Todo' items.
    Every in-scope calculation function must be Ported or N/A with an explicit reason.
    """
    coverage_file = os.path.join(os.path.dirname(__file__), "..", "..", "docs", "calc_coverage.md")
    assert os.path.exists(coverage_file), "docs/calc_coverage.md must exist."

    with open(coverage_file, "r", encoding="utf-8") as f:
        content = f.read()

    todos = re.findall(r'\|\s*\*\*Todo\*\*\s*\|', content)
    assert len(todos) == 0, f"Found {len(todos)} Todo items remaining in docs/calc_coverage.md"
