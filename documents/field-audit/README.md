# Tax-form field verification

Restored all 39 PDFs from commit `88c006d` into their original four folders without checking out that commit or replacing app code. Source SHA-256 hashes are recorded in `field-manifest.json`.

## Results

- 27 form PDFs contain 2,089 text/checkbox/radio entry fields across 50 field-bearing pages.
- 12 instruction PDFs contain no interactive entry fields. Some form PDFs also contain non-entry pages.
- 12 push-button widgets (print/reset controls) are excluded.
- All entry rectangles have positive dimensions and lie inside the page.
- Independent PDF.js 6.3.289 and PyMuPDF extraction agree on all 2,089 widget identities, names, counts and rectangles. Maximum coordinate difference: 0.000046875 points; tolerance: 0.02 points. See `pdfjs-verification.json`.
- Visual spot checks of the first pages of English federal 1040, Illinois IL-1040, Spanish 1040 and Form 8863 confirm overlays align with printed input spaces. Other pages have machine-verified widget geometry and reviewable overlays, but have not all been individually visually approved.

`field-overlays.pdf` contains every field-bearing page with red rectangles. `previews/` contains first-page PNG overlays for every form. These are verification artifacts; original PDFs remain unchanged.

## Coordinate contract

Manifest rectangles use PDF points, top-left origin, `[x0,y0,x1,y1]`. Normalized rectangles use `{x,y,width,height}`, divided by the unrotated crop-page dimensions. PDF.js annotation rectangles start in PDF coordinates; transform both corners through `page.getViewport({scale:1,rotation:0}).convertToViewportPoint` and reorder min/max coordinates. Do not invert y a second time. All current pages have zero rotation; a future rotated/cropped document needs fresh verification.

Identify a template by its file hash, language and form/year rather than relying on a filename alone. A widget's numeric object ID is local to that exact PDF. Checkbox and radio values need type-aware parsing, not text overlap alone.

## What this establishes

For these exact PDFs, use the embedded widget rectangles instead of image-based box detection. This checks the document's declared entry geometry. It does not prove semantic assignments, text extraction accuracy, OCR performance or that a different issuer's form uses the same layout. Most federal fields have opaque names such as `f1_01`; they still need reviewed mappings to tax fields. Blank templates contain no completed taxpayer values.

No upload/extraction API, form-to-database mapping, or frontend viewer was built during this geometry check. No database changes were applied. The prepared profile migration covers the guide's original scope; this document collection additionally contains forms/schedules such as 8962, W-10, 9000, Schedule 2/3/M/NR/WIT and language preferences. Review their persistence requirements before claiming every restored form has a corresponding profile column.

## Reproduce

Python dependency: PyMuPDF. Node verification dependency: pdfjs-dist 6.3.289. Node 24 was used; these audit dependencies were installed outside the application and do not change its package lock.

From the repository root:

```bash
python tools/pdf-fields/audit_fields.py
npm install --prefix /tmp/pdf-box-validation pdfjs-dist@6.3.289
PDFJS_MODULE=/tmp/pdf-box-validation/node_modules/pdfjs-dist/legacy/build/pdf.mjs node tools/pdf-fields/verify_pdfjs.mjs
```

The Python generator regenerates manifests, overlays and previews; the verifier exits unsuccessfully for changed source hashes, missing fields, count mismatches or coordinates outside tolerance.

## Shared multilingual rules

`tools/pdf-fields/box_rules.mjs` defines language-independent normalization, page-bound validation, PDF.js coordinate conversion, and exact-hash template selection. The PDF.js verifier now uses this same conversion helper and compares both points and normalized coordinates against the manifest.

`node tools/pdf-fields/test_multilingual_rules.mjs` checks all 1,584 English and 505 Spanish entry boxes, confirms normalized regions remain unchanged at 0.5x/1x/2x zoom, rejects unknown document hashes, and checks a translated-layout regression case. Results are in `multilingual-verification.json`.

English and Spanish 1040 have 134 common page/field names, but 129 have different rectangle coordinates. Use the same geometry rules with each language's own exact document template. Never identify a box solely by a translated label, form number or English position. Other languages can use these same rules after their PDFs are scanned and verified; no templates for unprovided languages are assumed correct. Semantic field-to-tax-value mappings still need review separately.

## Subsequent upload integration

The geometry-only phase above has now been followed by numeric key mapping and upload integration. `tools/pdf-fields/build_key_maps.py` generates the server's tax-template registry; shared line keys are independent of the document language. See `starters/frontend/PDF_UPLOAD.md` for supported numeric mappings and the Record forms sequence. Geometry verification remains distinct from semantic mapping: ambiguous or non-numeric fields are omitted.
