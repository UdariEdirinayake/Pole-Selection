# Pole Engine

Pure Python calculation and evaluation package for distribution pole mechanical line design and sag-tension analysis.

## Engineering Standards & Constraints
* **Pure Python:** Zero web framework dependencies.
* **Sag-Tension Method:** LECO standard sag-tension chart lookup with linear interpolation. Catenary and parabolic state-change equations are strictly prohibited.
* **Explicit Units:** All functions and parameters use explicit units (`_m`, `_mm`, `_kn`, `_dan`, `_kg`, `_n`).
* **Fail-Closed Table Lookups:** Out-of-bounds ruling spans return `NOT ASSESSED` with explicit reasons; extrapolation is strictly forbidden.

## Installation

Install in editable mode in your environment:

```bash
pip install -e engine
```

Or from the workspace root:

```bash
pip install -e ./engine
```

## Running Tests

Run the engine test suite:

```bash
pytest engine/tests/
```
