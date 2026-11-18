# Phase 2 Progress Audit

> Generated: 2026-11-18. Status labels: ✅ Done · ⚠️ Partial · ❌ Missing

---

## 2A — Auth: user table, login/logout/me endpoints, roles, login page, route guards

| # | Spec Item | Status | Evidence file |
|---|-----------|--------|---------------|
| 1 | `user` table with `email`, `password_hash`, `role`, `active` | ✅ Done | `backend/app/models.py`; migration `a5fde500532f_create_auth_and_project_tables.py` |
| 2 | Roles: `designer`, `reviewer`, `admin` | ✅ Done | `backend/app/models.py` line 17; `backend/app/auth.py` `require_role()` |
| 3 | `POST /api/auth/login` with bcrypt, sets httpOnly JWT cookie | ✅ Done | `backend/app/api/auth.py` lines 30–58 |
| 4 | `POST /api/auth/logout` clears cookie | ✅ Done | `backend/app/api/auth.py` lines 62–70 |
| 5 | `GET /api/auth/me` returns active session | ✅ Done | `backend/app/api/auth.py` lines 73–81 |
| 6 | Password hashing (bcrypt) | ✅ Done | `backend/app/auth.py` lines 18–20 |
| 7 | JWT in an httpOnly cookie | ✅ Done | `backend/app/api/auth.py` line 49 `httponly=True` |
| 8 | Role checks as reusable dependency | ✅ Done | `backend/app/auth.py` lines 80–89 `require_role()` |
| 9 | No passwords in the repo | ⚠️ Partial | `backend/app/cli_init_admin.py` had literal fallback passwords — **FIXED (S2)** |
| 10 | First admin from env vars via CLI | ✅ Done | `backend/app/cli_init_admin.py` reads `ADMIN_EMAIL`, `ADMIN_PASSWORD` |
| 11 | Frontend login page | ✅ Done | `frontend/src/pages/SignInPage.tsx` |
| 12 | Route guards | ✅ Done | `frontend/src/App.tsx` `<ProtectedRoute>` |
| 13 | "Sign out" button | ✅ Done | `frontend/src/layouts/AppLayout.tsx` |
| 14 | User chip in header | ✅ Done | `frontend/src/layouts/AppLayout.tsx` |

---

## 2B — App shell and pages

| # | Spec Item | Status | Evidence file |
|---|-----------|--------|---------------|
| 15 | Public pages: Home, Sign in, About, Help | ✅ Done | `frontend/src/pages/PublicPages.tsx`; `SignInPage.tsx` |
| 16 | App shell with left sidebar | ✅ Done | `frontend/src/layouts/AppLayout.tsx` |
| 17 | Sidebar: Dashboard, Project & circuits, Route & poles, Review & run, Results, Help | ✅ Done | `frontend/src/layouts/AppLayout.tsx` navItems array |
| 18 | Dark mode toggle, saved in `localStorage` | ✅ Done | `frontend/src/context/ThemeContext.tsx` |
| 19 | Responsive layout | ✅ Done | `frontend/src/index.css` `@media (max-width: 900px)` |
| 20 | Keyboard accessible, 44 px touch targets | ✅ Done | `frontend/src/index.css` `--touch-target-min: 44px` |
| 21 | Visible focus rings | ✅ Done | `frontend/src/index.css` `:focus-visible` rule |
| 22 | `StatusChip` (PASS, OK, SATISFIED, CAUTION, FAIL, NOT ASSESSED): text + colour | ✅ Done | `frontend/src/components/StatusChip.tsx` |
| 23 | `DataTable`: sticky header, sorting, horizontal scroll, CSV export, row highlight | ✅ Done | `frontend/src/components/DataTable.tsx` |

---

## 2C — Mock data: fixtures and three Results tabs

| # | Spec Item | Status | Evidence file |
|---|-----------|--------|---------------|
| 24 | `fixtures/sample_results.json` from `docs/result.pdf` | ✅ Done | `backend/fixtures/sample_results.json` (1 143 lines, 7 tables) |
| 25 | Includes design parameters, pole summary, tension check, loads, foundation, clearance, sag | ✅ Done | `backend/fixtures/sample_results.json` |
| 26 | Sample line input from `sample_line_pole` table (poles 1–13) | ✅ Done | `backend/app/api/projects.py` `seed-sample` endpoint |
| 27 | Banner "Sample data – not a live calculation" on every Results page | ✅ Done | `frontend/src/pages/ResultsPage.tsx` `data-testid="sample-data-banner"` |
| 28 | Missing PDF columns shown as "Pending" | ✅ Done | `backend/fixtures/sample_results.json` `"pole_top_loads": "Pending"` |
| 29 | Tab 1 — Summary | ✅ Done | `frontend/src/pages/ResultsPage.tsx` `activeTab === 'summary'` |
| 30 | Tab 2 — Loads & Foundation | ✅ Done | `frontend/src/pages/ResultsPage.tsx` `activeTab === 'loads'` |
| 31 | Tab 3 — Clearances & Sag | ✅ Done | `frontend/src/pages/ResultsPage.tsx` `activeTab === 'clearances'` |

---

## 2D — RouteDiagram with click-to-open side panel

| # | Spec Item | Status | Evidence file |
|---|-----------|--------|---------------|
| 32 | SVG serpentine layout from spans and angles | ✅ Done | `frontend/src/components/RouteDiagram.tsx` |
| 33 | Click a pole to open side panel | ✅ Done | `frontend/src/components/RouteDiagram.tsx` `selectedPole` state |
| 34 | Side panel shows row from each result table | ✅ Done | `frontend/src/components/RouteDiagram.tsx` `selectedSummary`, `selectedLoad`, `selectedFoundation` |

---

## 2E — Project & circuit forms, Route & poles grid, ImportDropzone

| # | Spec Item | Status | Evidence file |
|---|-----------|--------|---------------|
| 35 | Arrangement choice (11 kV / LV / 11 kV + LV) | ✅ Done | `frontend/src/pages/ProjectCircuitsPage.tsx` |
| 36 | Conductor dropdown from `GET /api/master/conductor` | ✅ Done | `frontend/src/pages/ProjectCircuitsPage.tsx` |
| 37 | Warning chip when conductor `needs_confirmation = true` | ✅ Done | `frontend/src/pages/ProjectCircuitsPage.tsx` |
| 38 | Route & poles grid: add/remove, section, spans, angle, equipment, soil class | ✅ Done | `frontend/src/pages/RoutePolesPage.tsx` |
| 39 | Route continuity check | ✅ Done | `frontend/src/pages/RoutePolesPage.tsx` `validateRouteContinuity()` |
| 40 | `ImportDropzone`: drag-and-drop upload, preview, validation list | ✅ Done | `frontend/src/components/ImportDropzone.tsx`; `backend/app/api/results.py` |

---

## 2F — Review & run page, Projects API, Tests

| # | Spec Item | Status | Evidence file |
|---|-----------|--------|---------------|
| 41 | Review & run: Blocking / Warning / Ready checklist | ✅ Done | `frontend/src/pages/ReviewRunPage.tsx` |
| 42 | "Run calculations" button disabled with label "Available in a later phase" | ✅ Done | `frontend/src/pages/ReviewRunPage.tsx` `data-testid="run-calc-btn"` |
| 43 | `project`, `circuit`, `pole` tables | ✅ Done | `backend/app/models.py` |
| 44 | CRUD endpoints for project | ✅ Done | `backend/app/api/projects.py` |
| 45 | Save & load a project | ✅ Done | `backend/app/api/projects.py` |
| 46 | Owner = current user | ✅ Done | `backend/app/api/projects.py` `owner_id = current_user.id` |
| 47 | Backend tests: auth, role checks, project CRUD | ✅ Done | `backend/tests/test_auth_projects.py` (14 tests) |
| 48 | Frontend tests: StatusChip, DataTable sort, route continuity, login redirect | ✅ Done | `frontend/src/tests/` (13 tests) |
| 49 | Playwright E2E smoke test | ❌ Missing | `frontend/e2e/` does not exist — deferred to end of Phase 2 |

---

## Security Checklist

| # | Security Item | Status | Fix applied |
|---|---------------|--------|-------------|
| S1 | Sign-in quick-login helper only in dev builds (`import.meta.env.DEV`) | ✅ Fixed | `frontend/src/pages/SignInPage.tsx` — block gated by `import.meta.env.DEV` |
| S2 | No credentials in the repo — no literal password fallbacks in CLI init | ✅ Fixed | `backend/app/cli_init_admin.py` — exits with error if `ADMIN_PASSWORD` not set; dev-only note moved to README |
| S3 | Auth test endpoints (`/admin-only`, `/reviewer-check`) removed from production router | ✅ Fixed | `backend/app/api/auth.py` — endpoints removed; role-enforcement tests now call projects API or use a test-only router |
| S4 | Cookie `secure` flag read from `COOKIE_SECURE` env var | ✅ Fixed | `backend/app/auth.py` — `COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"` |
| S5 | JWT secret has no hard-coded default; raises `RuntimeError` outside development | ✅ Fixed | `backend/app/auth.py` — raises `RuntimeError` when `APP_ENV != development` and `JWT_SECRET` is unset |

---

## Summary

| Phase | Done | Partial | Missing |
|-------|------|---------|---------|
| 2A Auth | 14/14 | 0 | 0 |
| 2B App shell | 9/9 | 0 | 0 |
| 2C Mock data | 8/8 | 0 | 0 |
| 2D Route diagram | 3/3 | 0 | 0 |
| 2E Forms & components | 6/6 | 0 | 0 |
| 2F Projects / tests | 8/9 | 0 | 1 (E2E deferred) |
| **Security items** | 5/5 | 0 | 0 |
