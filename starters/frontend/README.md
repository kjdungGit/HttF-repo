# KEENFinance client application

A React/Next.js and Tailwind tax-preparation demo. There is no sign-in, database, environment key, or application backend. Questions, PDF review, recorded forms, language selection, and progress run in the browser.

From this directory:

```sh
npm ci
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Run `npm test`, `npm run lint`, and `npm run build` to verify changes. `npm run build` exports the complete static site to `out/`. Deploy that directory on any static host; no Next.js or Supabase server is needed in production. To preview the export with a static-file server locally, run `npm start`.

- `/`: English/Spanish introduction, narration, and progress-backup restoration.
- `/file/`: life-event questions, W-2 review, and a personalized preparation checklist.
- `/file/advanced/`: the detailed guide and multi-form PDF review widget.

PDFs are read locally using PDF.js and the reviewed form registry. The build/development scripts copy the worker, fonts, and WASM assets from the installed package into ignored `public/pdfjs/`; no external PDF service is used. Unsupported layouts and scans use manual entry.

Progress is stored under `keenfinance:preparation:v1:device` and reviewed forms under `keenfinance:forms:v1` in localStorage. Clearing browser data removes these copies. Progress backups and recorded-form backups can be downloaded and restored in another browser. Original PDFs and identity fields such as SSNs are not saved. Browser storage failure is reported and must not be treated as a successful save.
