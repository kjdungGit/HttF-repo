# Accessible preparation overhaul

The default flow serves first-time Illinois filers preparing 2025 taxes, including people who prefer Spanish, need narration, do not know tax vocabulary, or do not have every document. The working slice is employer income: life-event questions → document collection → review one W-2 → a personalized preparation checklist and official filing/help options.

## What changed

- `/` offers an immediate start, English/Spanish narration, and progress restoration. Scrolling through every explanation is no longer required to begin.
- `/file` asks one question at a time, accepts “I don’t know,” explains each choice, and preserves uncertainty in the checklist. Keyboard focus follows the question.
- Missing W-2s can be collected later. Manual entry works without signing in. Unsupported PDF layouts and scans have a manual fallback; answers are preserved.
- Four monetary W-2 boxes are mapped from the official IRS 2025 employee Copy B. Selecting an amount highlights its verified rectangle on the uploaded PDF. SSNs and bank data are excluded from extracted JSON. Review confirmation is required; blanks remain unknown and zero remains zero. State amounts are from the first state row and must be checked against box 15.
- The checklist includes document requests, unresolved questions, and links to IRS assistance/Free File and Illinois filing information. It can be printed, downloaded, or narrated in English/Spanish. These are preparation notes, not tax calculations or filed returns.
- Browser progress is saved automatically and scoped to the current verified profile or an unsigned device draft. Online saves are explicit. A downloaded backup restores preparation data across browsers; it does not restore account credentials. Repeating a username after logout creates a new guest identity.
- Existing reviewed 2025 W-2 values are loaded from the signed-in owner's saved forms when the current preparation has no W-2 values. The previous detailed guide and multi-form upload widget remain at `/file/advanced`.

## Backend and setup

Run from `starters/frontend`:

```sh
npm ci
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Development/build scripts copy the installed PDF.js worker into ignored `public/pdfjs`. The tracked `.env.local` contains the shared Supabase public URL and publishable key. Keep service-role keys in ignored `.env.development.local` or `.env.production.local`; never add one to browser configuration.

Apply the profile tax-form migrations in order, followed by `supabase/migrations/202610030003_overhaul.sql`, in Supabase SQL Editor. The new migration adds `preparation_progress` and permits W-2 appends through the owner-scoped atomic RPC. This task tests SQL locally; it does not apply it to the hosted project. Username-only sessions require Anonymous Sign-Ins enabled in Supabase Auth.

- `GET/POST /api/preparation`: verified-owner progress reads/updates, JSON validation, bounded request stream, private no-store responses.
- `POST /api/preparation/w2`: confirmed canonical values only, verified owner through the RPC, stable record IDs for retry deduplication.
- `POST /api/documents/upload`: existing signed multipart pipeline, extended with the two verified W-2 templates (full IRS document and extracted Copy B).

Original PDF template generation: run the existing key-map tool, then `python tools/pdf-fields/add_w2_templates.py` to append W-2 mappings. Geometry verification and the reviewed image are in `documents/w2-verification`. Employee/vendor W-2 layouts without an exact reviewed mapping use manual entry. Spanish UI can guide review of the English W-2; unverified translated layouts are not guessed.

## Verification and judging

`npm test`, `npm run lint`, and `npm run build` validate the application. With Playwright and Chromium installed, run `TEST_BASE_URL=http://localhost:3150 node tools/check-overhaul-browser.cjs` against a running production server (use `PLAYWRIGHT_MODULE` for an external Playwright installation). `PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node tools/pdf-fields/check_migrations.mjs` tests all migrations, RLS isolation, W-2 appends, and retry behavior against local PostgreSQL/WASM. Browser checks use simulated sessions/extraction and actual PDF rendering; they do not establish hosted database writes or real-user usability.

For a hackathon demo, compare the old detailed guide with this flow using virtual scenarios: an English employer-income filer, a Spanish-speaking filer, a keyboard-only filer, a missing-W-2 scenario, and an unsupported scan. Record completion, actions/time needed to reach a useful checklist, corrections to extracted numbers, and recovery after interruption. Report simulated results as simulated. Accessibility expansion and real-user completion improvements remain hypotheses until evaluated; do not present benchmark targets as research findings.

Not covered in this slice: OCR, automatic tax calculations/eligibility, submission to agencies, reliable identity recovery after guest logout, multiple W-2 reviews in one preparation draft, or specialist handling of other income types. The checklist directs those situations to gathering records and appropriate help.
