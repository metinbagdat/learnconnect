## Plan: LearnConnect IA & UI updates (navbar, locale, exam structure)

### Scope agreed
- New top-level layout with navbar: Login/Register buttons, TR/EN language toggle with icons.
- Stub curriculum tree under LGS, TYT, AYT (categories/lessons/units placeholders; no full MEB import yet).
- Add admin dashboard entry point.
- Multilingual-ready: visible toggle.

### Steps
1) Add curriculum stub data
   - Create/shared location for exam structure (e.g., `client/src/data/exams.ts`) with categories: LGS, TYT, AYT → subjects → units (placeholders).
   - Include labels for TR/EN for future i18n.

2) New top-level layout
   - Add layout component (e.g., `client/src/components/layout/LearnConnectLayout.tsx`) with navbar:
     - Brand/logo placeholder
     - Nav links: Home, Exams (dropdown: LGS, TYT, AYT), AI Portal, Admin
     - Buttons: Login, Register
     - Language toggle with TR/EN icons
   - Wrap main app or routes with this layout (minimal integration to avoid regressions).

3) Admin dashboard shell
   - Add route/page (e.g., `client/src/pages/AdminDashboard.tsx`) with sections: Users, Content/Curriculum, AI Settings, Payments placeholder.
   - Link from navbar “Admin”.

4) Exams browsing page
   - Add page (e.g., `client/src/pages/Exams.tsx`) that reads stub data and shows tree (LGS, TYT, AYT) with subjects/units.
   - Ensure bilingual labels sourced from data.

5) Multilanguage toggle plumbing (lightweight)
   - Introduce minimal locale state/context (TR/EN) shared by layout/pages.
   - Use it to pick label variants from stub data; default to EN.

6) Smoke check
   - Basic build/test: `npm run dev` start; ensure pages render and nav links work.

Notes
- No DB or API changes; UI-only stubs.
- Icons: use existing icon set or simple text tags “TR/EN” if no asset.
- Keep changes minimal to avoid breaking current flows.

