# Local PDF review

Both the guided W-2 review and detailed guide read PDF bytes locally with PDF.js. No file is sent to an API or database. Browser extraction uses the same reviewed widget names, page dimensions, rectangles, and bilingual numeric keys as the original verification.

The limit is 8 MB and 16 pages per PDF. Unknown layouts, scans, flattened documents, and password-protected files have an explicit error/manual-entry fallback. Empty boxes remain unknown; only approved numeric keys are recorded. Original PDFs remain in memory during the visit.

Record forms validates reviewed values and stores JSON in localStorage. Previously recorded forms show checked status when reopening the browser. Download/restore controls preserve recorded values across browsers. A storage error keeps the review available and does not mark it as recorded.

Sources and audited boxes remain in the repository's tax-form folders and `documents/field-audit`/`documents/w2-verification`. Development/build scripts copy installed PDF.js worker/font/WASM assets for static hosting.
