# Styling Root Cause Diagnosis

**Date:** 2026-11-18  
**Scope:** Phase 2 UI Shell Styling Audit  
**Author:** Antigravity Engineering Assistant  

---

## 1. Questions Investigated

### Q1: Is Tailwind installed and imported in the main CSS file?
- **Finding:** **No.** Neither `tailwindcss`, `postcss`, nor `autoprefixer` are installed in `frontend/package.json` dependencies or devDependencies.
- **Main CSS:** `frontend/src/index.css` is a pure vanilla CSS design system file. There are no `@tailwind base;`, `@tailwind components;`, or `@tailwind utilities;` directives.

### Q2: Do the 'content' globs in the Tailwind config include every file under `src` (ts, tsx)?
- **Finding:** **N/A.** There is no `tailwind.config.js`, `tailwind.config.ts`, or `postcss.config.js` anywhere in the repository.

### Q3: Do the page components use class names that exist?
- **Finding:** **CRITICAL MISMATCHES DETECTED.**
  Page components (`DashboardPage.tsx` and `ProjectCircuitsPage.tsx`) were written with ad-hoc BEM-like class names that were **never defined** in `src/index.css`:

  1. **Dashboard Page Mismatches:**
     - Component uses `<div className="stats-row">` — in `index.css` it was named `.stats-grid`. Since `.stats-row` was undefined, cards took default `display: block` and stacked vertically.
     - Component uses `<div className="stat-value">` — in `index.css` it was named `.stat-val`.
     - Component uses `<div className="content-card">` and `.content-card-header` — neither exists in `index.css` (`.card` and `.card-header` exist).
     - Component uses `.projects-grid`, `.project-card`, `.project-card-top`, `.project-title`, `.project-desc`, `.project-meta`, `.project-footer`, `.project-date`, `.btn-open-project` — **none of these classes existed in `index.css`**.
     - Component uses `<span className="badge badge-primary">` and `.badge-warning` — **neither exists in `index.css`**. Because inline spans without margins or borders were rendered, `p.line_arrangement` (`11 kV + LV`) and `p.status` (`draft`) collapsed into the unstyled string `'11 kV + LVdraft'`.

  2. **Project & Circuits Page Mismatches:**
     - Component uses `.form-card`, `.form-section`, and `.form-grid-2` — **none of these classes existed in `index.css`**.
     - Form `<label>` and `<input>` elements lacked classes (`form-label`, `form-input`) and were unstyled browser defaults, causing labels to collide directly with inputs.
     - Component uses `.arrangement-selector`, `.arrangement-option`, and `.arrangement-label` — **none existed in `index.css`**, causing the 3 options to render as bare, cramped radio buttons.
     - Component uses `.circuit-card`, `.circuit-header`, and `.circuit-fields` — **none existed in `index.css`**.

### Q4: Invented Labels
- `AppLayout.tsx` contained hardcoded strings `'LECO STD EN-50341'` and `'Enterprise'`.
- `DashboardPage.tsx` contained `'LECO 2026'`.
- **Requirement:** Remove these invented labels and replace them with live master data version and import date fetched from `GET /api/master/dataset-versions`.

---

## 2. Remediation Strategy

1. **Shared Layout Component Library (`frontend/src/components/layout/`):**
   Create a standardized set of reusable, well-styled components:
   - `PageHeader`: Title, subtitle, actions slot
   - `Card`: Surface container with header, body, border, shadow
   - `KpiCard`: Single metric card with title, large value, subtitle, icon, trend indicator
   - `FormField`: Stacked label, input container, hint text, error message
   - `SelectCard`: Large interactive option card with radio/check indicator, title, and description
   - `StatusChip`: Verified semantic chip with dot and text (PASS, CAUTION, FAIL, OK, PENDING)
   - `ProjectRow` / `ProjectCard`: Dedicated project card with badge, status, metadata, and open button
   - `EmptyState`: Centered icon, title, message, and action CTA

2. **Rebuild `DashboardPage.tsx` & `ProjectCircuitsPage.tsx`:**
   Use **ONLY** the shared layout components above. Ensure KPI cards sit in a responsive 4-column row (`grid-template-columns: repeat(4, 1fr)` on desktop, 1-col on mobile) and arrangement cards sit in a 3-column row.

3. **Master Data Dataset Version Display:**
   Fetch `GET /api/master/dataset-versions` to display the actual imported dataset version name (e.g. `LECO_Master_2026_Initial`) and import date instead of hardcoded labels.

4. **Visual Verification:**
   Clear Vite build cache, restart Vite dev server, and capture Playwright full-page screenshots at 1440 px and 390 px in both Light and Dark modes into `docs/ui-after/`.
