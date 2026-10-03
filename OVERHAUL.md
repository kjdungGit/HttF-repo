# Accessible, client-side preparation

The default flow serves first-time Illinois filers preparing 2025 taxes, including people who prefer Spanish, need narration, do not know tax vocabulary, or do not have every document. The complete demo slice is employer income: life-event questions → document collection → review one W-2 → personalized checklist and official filing/help options.

## Behavior

- `/` offers an immediate start, English/Spanish narration, and progress restoration.
- `/file/` asks one life-event question at a time, accepts “I don’t know,” explains choices, and retains unresolved questions in the checklist. Keyboard focus follows the question.
- Missing W-2s can be collected later. Manual entry and PDF extraction work without an account. Unsupported layouts and scans keep a manual fallback.
- Four monetary W-2 boxes are mapped from the official IRS 2025 employee Copy B. Selecting an amount highlights its verified rectangle on the original PDF. The first state row must be checked against box 15. Blank remains unknown and zero remains zero.
- The checklist links to IRS assistance/Free File and Illinois filing information. It can be printed, downloaded, and narrated in English/Spanish. These are preparation notes, not calculations or filed returns.
- Progress is automatically saved in localStorage. Record forms saves reviewed numeric JSON on this browser, without a database. A progress backup restores the guided preparation; a forms backup restores recorded forms. Clearing browser data removes local copies.
- Returning to this browser loads recorded forms, including checked saved-status indicators. Previously recorded W-2 values autofill an empty W-2 review. The detailed guide remains at `/file/advanced/`.

## Architecture and verification

There are no authentication routes, database routes, session middleware, Supabase SDKs, credentials, SQL migrations, or standalone backend starters. Next.js exports static HTML/JS/CSS to `starters/frontend/out/`; production needs only a static host. PDF parsing runs locally in a PDF.js worker, using same-origin worker/font/WASM assets. Original PDFs remain in memory and are not uploaded or saved in localStorage. Extracted fields omit SSNs and bank information.

Run `npm ci`, `npm run dev`, `npm test`, `npm run lint`, and `npm run build` from `starters/frontend`. `npm start` previews `out/` using a development-only static-file server, with no application APIs. PDF template generation remains a development tool: run the existing key-map tool, then `python tools/pdf-fields/add_w2_templates.py`. W-2 geometry verification and its reviewed image are in `documents/w2-verification`.

Tests cover mapped extraction, uncertainty, backup validation, local recording, duplicate IDs, malformed imports, and storage failures. Browser checks verify the exported static site, real local PDF extraction/highlighting, saved forms after reload, EN/ES narration, keyboard completion, and no authentication/API/Supabase requests.

For judging, compare the prior detailed guide and guided flow using virtual scenarios: English employer-income filer, Spanish-speaking filer, keyboard-only filer, missing W-2, and unsupported scan. Record completion, time/actions to reach a useful checklist, extraction corrections, and recovery after interruption. Report simulated results as simulated. Real-user accessibility improvement remains a hypothesis until evaluated.

Not covered: OCR, automatic eligibility/calculations, submission to agencies, multiple W-2s within one guided draft, or specialist handling of other income types. Multiple reviewed documents can be recorded through the detailed guide.
