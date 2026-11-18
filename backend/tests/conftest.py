"""Root conftest — sets environment variables needed by test-only code paths."""
import os

# TESTING=1 enables test-only endpoints (e.g. /api/auth/admin-only)
# that are excluded from production routers.
os.environ["TESTING"] = "1"
