# Template implementation tasks

Branch: `template/backend-frontend`

Complete these tasks in order. Use the existing checkout and starter projects.

## 1. Blank backend API and database

Use `starters/backend-fastapi` to prepare a minimal FastAPI API with a local SQLite database. Keep it free of application-specific entities and business logic.

- Add configurable database storage with a persistent local default.
- Initialize and close database connections safely.
- Keep generated database files out of Git.
- Provide a health endpoint that checks database connectivity.
- Document installation, startup, and database configuration.
- Verify startup, database initialization, a successful health response, and persistence across a restart.

Complete and validate this task before starting task 2.

## 2. Simple frontend website

Use `starters/frontend` to build a minimal Next.js and Tailwind website with two components: `Header` and `LandingPage`.

- Display `Template` in the header and as the landing page heading.
- Set the browser page title to `Template`.
- Compose the two components on the home route.
- Use semantic HTML and a simple responsive layout.
- Avoid adding unrelated sections, authentication, or application features.
- Verify lint, TypeScript, production build, and the rendered home page.

The frontend does not require API integration for this task.
