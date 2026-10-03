# Collective subagent memory

Shared memory for alpha, beta, ci, Arch, and Krypton. Role and delegation instructions are in `Agentic.md`. Entries are chronological. Historical event times below were not recorded; their order follows the conversation, not invented timestamps.

## Historical record — 2026-10-02, exact times unknown

1. **Primary agent — Environment inspection:** Repository initially contained only `README.md` at `5f2a929`. Node.js 24 and Python 3.12 were available; GitHub read access worked.
2. **Primary agent — Starters prepared:** Created Next.js/React/TypeScript/Tailwind frontend, basic Node HTTP backend, and FastAPI backend under `starters/`. Frontend build, lint, type checks, rendered page and generated Tailwind CSS passed. Backend health requests and FastAPI OpenAPI checks passed. These checks describe that run, not perpetual readiness.
3. **Primary agent — Setup saved:** Saved reusable installation and startup configuration. Persistence was confirmed; publication and fresh-task restoration were not verified.
4. **Primary agent — Starter commit:** Committed starter source, dependency locks, and documentation as `300a574`; dependency directories and generated outputs were excluded.
5. **Primary agent — Ordered tasks:** Created branch `template/backend-frontend` and committed `TASKS.md` as `df9e39c`. Task 1: blank FastAPI API with persistent SQLite. Task 2: Header and LandingPage titled Template. These are task definitions; neither implementation was completed.
6. **User / primary agent — Repository rename:** User renamed the GitHub repository to `HttF-repo`. Updated origin to `https://github.com/kjdungGit/HttF-repo.git` and verified read access. Checkout remains `/workspace/tailwind-nodejs-template` to preserve setup paths.
7. **Primary agent — Push:** Successfully pushed `template/backend-frontend` and configured upstream tracking after explicit user instruction.
8. **User / primary agent — Product objectives:** Saved hackathon objectives in root `AGENTS.md`: field/operations users, actionable telemetry, operational ROI, complete backend demo workflow, and frontend presentation priority. File was not committed or pushed at that point.
9. **User / primary agent — Initial team:** Created coordinator, backend, and UI/UX subagents. User finalized names: alpha = coordinator/manager; beta = backend/API; ci = frontend/UI/UX.
10. **alpha, beta, ci — Initial review:** Agents reviewed the repository without editing code. beta identified missing SQLite and proposed configurable persistence, safe connection handling, database-aware health checks, and restart validation. ci proposed Header/LandingPage and Template browser title. alpha confirmed backend validation precedes frontend implementation and larger domain workflows remain later work.

## 2026-10-02T16:18:42-05:00 — Primary agent — Team expansion

- **Decision:** Created Arch as project alignment reviewer and Krypton as market research/report-writing agent, as requested by the user.
- **Delegation:** Krypton reports to Arch; Arch routes reviewed recommendations through alpha; alpha coordinates beta and ci.
- **Status:** New agents assigned initial reviews/research agendas only. No implementation or external market findings are claimed.
- **Documentation:** Created `Agentic.md` as the single roster/personality/skills/delegation source and this file as collective memory.
- **Next owners:** Arch reviews deliverable alignment; Krypton identifies a sourced research agenda; alpha collects findings and serializes future memory updates.

## 2026-10-02T16:20:10-05:00 — Arch and Krypton — Initial handoffs received

- **Arch:** Reviewed project objectives and ordered tasks; sent alpha guidance to complete the backend/database foundation, then the Template frontend, keeping the larger operational workflow for later product work.
- **Krypton:** Sent Arch a research agenda covering customer/buyer validation, fleet-tool differentiation, development and neglected-issue opportunities, and credible demo metrics. Faster triage and assignment remain hypotheses; no external research was performed.
- **Status:** Both reviews completed without file edits or implementation. All five agents were notified that the roster and memory files are available.
- **Next owner:** alpha collects reviewed recommendations and coordinates future assignments; implementation awaits assignment.

## 2026-10-02T16:21:51-05:00 — Primary agent — AI workflow relocation

- **User request:** Keep AI instructions, role definitions, and collective memory in a side folder rather than the application tree.
- **Changes:** Moved root AGENTS.md, Agentic.md, and Mem.md into ai-workflow/; moved frontend AGENTS.md and CLAUDE.md into ai-workflow/frontend/. Updated active relative references; historical paths above describe their original locations.
- **Runtime configuration:** Disabled Next.js agentRules auto-generation to prevent frontend instruction files from returning on startup.
- **Workflow:** Explicitly load ai-workflow/ instructions for future AI work. TASKS.md remains the product task list at repository root.
- **Validation:** Frontend lint, TypeScript, startup, and HTTP response passed; AI instruction files were not regenerated inside the application. Changes remain uncommitted.
