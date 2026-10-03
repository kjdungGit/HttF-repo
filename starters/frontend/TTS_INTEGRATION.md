# English/Spanish narration

Intro, guided preparation, and the detailed guide use browser SpeechSynthesis. Listen starts a clip, Pause suspends it, Play resumes, and Stop cancels it. Language changes cancel playback and select en-US/es-ES voices when available. Voice availability and sound depend on the browser and operating system; no remote TTS service is used.

Locale starts as English during static prerendering and the first browser render, then restores the saved language after hydration. LanguageProvider updates the HTML language attribute and tolerates unavailable local storage. Speech controls check capabilities and ignore stale callbacks from canceled clips. Unsupported speech has a visible fallback.

The app has no account, server API, or database integration. PDF extraction and form recording are local browser operations, with English/Spanish widget copy. Narration does not introduce voice dictation.
