# Frontend/backend TTS integration

Branch: `frontend-backend-integration`, created from the completed Backend-API-DEV work. Merges `390b58be3e837b9282ae5a392849f6fb0aa7743a` from `origin/frontEnd`.

IntroPage and all guide steps now have English/Spanish read-aloud controls using browser SpeechSynthesis. Listen starts/restarts a clip, Pause suspends it, Play resumes, and Stop cancels it. Language changes stop playback and choose en-US/es-ES voices when available. Voice availability and actual audio depend on the browser/OS; no backend TTS key or new remote speech service is required.

The translated guide retains the shared sign-in header, verified PDF upload, editable JSON review, Record forms RPC, and saved-profile checkboxes. The backend routes and owner checks remain connected. Shared upload/account widget copy currently remains English; guide and intro content/read-aloud are translated. This integration does not introduce voice dictation.

Conflict resolution kept the backend dependency versions and added i18next/react-i18next. Locale starts as English on server and first browser render, then restores the saved language after hydration. LanguageProvider updates the HTML language attribute and handles unavailable local storage. Speech controls check browser capability before accessing APIs, and generation guards ignore callbacks from canceled clips.

Verification:

- All 41 backend tests pass; lint and production build pass.
- Browser checks with controlled synthesis verify English/Spanish utterance language, pause/resume, canceled-clip callback safety, persisted locale reload without hydration errors, and step controls.
- Unsupported speech and blocked local storage do not crash the page.
- Saved-profile loading, checked indicators, account-switch stale response rejection, logout clearing, bilingual PDF edits, Record forms, partial failures and retry deduplication pass controlled-response browser regressions.
- Real unauthenticated upload remains rejected. Live authenticated Supabase writes and audible OS voice quality were not newly verified; existing Supabase setup requirements still apply.
