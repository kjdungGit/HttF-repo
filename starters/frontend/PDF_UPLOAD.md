# PDF upload, bilingual keys, and profile recording

The shared `TaxDocumentUpload` widget is wired into the active `/file` guide and the existing LandingPage component. The home route still renders IntroPage; its start button leads to `/file`. Choose **Upload documents**, select or drop PDFs, review/edit the numeric fields, then click **Record forms** at the widget bottom.

## Backend sequence

1. `POST /api/documents/upload` receives one multipart `file`, verifies the current Supabase user and same-origin browser request, and bounds the upload to 8 MB. Multi-file selection makes sequential requests.
2. PDF.js reads widget names/rectangles and identifies the template using all field geometry and page sizes, independent of the uploaded filename. Filled documents have different byte hashes from blank originals, so identification uses their verified structure.
3. `tax-templates.json` maps language-specific widgets to common numeric keys. Form 1040 has 57 explicit line assignments per language, including `wages`, `adjusted_gross_income`, `total_federal_withholding`, and `refund`. Spanish line 10 moves to page 2 and uses a different widget ID; it still becomes `adjustments_to_income`.
4. Other mapped forms use `line_1`, `line_2a`, etc., scoped by their form type and destination column. These keys are assigned from explicit PDF Line labels or unambiguous printed line anchors. Repeated/ambiguous labels are omitted instead of assigned by translation guesswork. Non-numeric personal identifiers, bank details, checkboxes, and unmapped table cells are not included.
5. The extraction returns decimal strings or null plus page/line/box evidence. Populated widget values take precedence; bounded page text is a fallback. No OCR or remote AI provider is called. Original PDFs are not stored.
6. Clicking **Record forms** confirms the edited JSON and sends each draft to `POST /api/documents/save`. Server validation allows only the selected template's numeric keys; it never accepts an owner ID or destination column from the browser. The RPC derives ownership from `auth.uid()` and appends to the corresponding profile array.

Extracted values are drafts until reviewed. Missing values stay null, not zero. Saving omits unknown fields and rejects an entirely empty record. Amounts use US tax-form separators (decimal point, optional thousands commas) regardless of document language; ambiguous formats are rejected. Dates/names/checkbox interpretation and calculated tax results are outside this numeric mapping.

## Saved profile forms

The upload widget loads `GET /api/documents` when opened and refreshes immediately after a verified sign-in or account change. The endpoint returns only the current verified user's saved profile forms; no browser-supplied owner ID is accepted. Each saved item has a checked, disabled checkbox indicating **already recorded**, not a selection or deletion action. Unknown legacy tax years appear as “Year unknown.”

Username-only sign-in creates a guest account. Reloading with its existing cookie restores that account’s forms; signing out and entering the same username creates a new account and does not recover the prior guest’s forms.

Successful recording refreshes the saved list and merges rows by record ID so an uploaded form is not shown twice. Loading and recoverable errors are displayed separately from PDF review errors. Signing out or switching accounts clears prior account data, ignores stale responses, and removes previous-owner drafts even when the widget was closed during the switch. Recording is disabled until the session/list check finishes. Uploaded draft ownership comes from the verified upload response, not user input.

## Supported templates and limits

The registry contains all 27 restored form PDFs; 22 currently have numeric mappings. Federal 1040, Schedules 1/1-A/2/3/8812 have English and Spanish numeric mappings. English Forms 2441, 8863, 8880, 8962 and Illinois 1040/ICR/E-EITC/WIT/M/NR have numeric mappings, with partial coverage where rows/labels are ambiguous. Schedule EIC, language-preference/accessibility forms, and W-10 have boxes but no numeric mapping and return a clear unsupported-mapping response. W-2/1099 payer layouts were not present in commit 88c006d and are not supported merely because the guide names them.

Scanned images, flattened PDFs with no verified widgets, unrecognized layouts, encrypted/damaged files, and forms exceeding 10 pages are rejected. Future versions/languages must supply their own verified layouts and semantic line mappings. Template geometry does not establish tax eligibility or validate that the user entered the correct taxpayer values.

## Deployment

Use Node >=22.13 or Node 24 and install dependencies with `npm ci`. PDF.js runs as an external server package; Next file tracing includes its worker and font assets.

Apply both Supabase migrations in order (see ../../supabase/README.md). Enable Anonymous Sign-Ins for username-only access and confirm the Auth insert trigger creates a profile. Live saving remains unavailable until the RPC, columns, grants, and profile are deployed. No admin database access was available to apply them during this change.

## Verification

- 41 backend tests passed, including actual synthetic filled English/Spanish PDF extraction, shifted Schedule 2 field IDs, multipart parsing, confirmed-record validation, origin/auth guards, and RPC payload routing.
- All 22 mapped blank templates produced no invented numeric values.
- Saved-list browser checks used controlled API responses to verify immediate sign-in loading, checked status indicators, deduplication, account-switch stale-response rejection, unknown years, retry, logout clearing, and previous-owner draft removal after widget remount. Live authenticated saved-list access has not been verified.
- Browser checks used real extraction results with controlled API responses to verify bilingual multi-file selection, edits, the Record forms button, partial failures, and retries. A real unsigned upload returned 401.
- Both SQL migrations ran in local PostgreSQL/WASM with ownership RLS, retained arrays, retry deduplication, and rejected invalid access.
- Lint and production build passed. Live authenticated Supabase writes have not been verified.

Regenerate mapping metadata with `python tools/pdf-fields/build_key_maps.py` from the repository root. Review semantic mappings when changing templates. Regenerate synthetic fixtures with `python tools/pdf-fields/make_test_fixtures.py`; fixtures contain demonstration values only. Run local migration checks with `tools/pdf-fields/check_migrations.mjs` and an externally installed @electric-sql/pglite module.
