# AI workflow side folder

AI coordination and assistant instructions are kept here, separate from application source.

- `AGENTS.md`: project objectives and implementation guidance.
- `Agentic.md`: the single roster, personalities, skills, and delegation rules.
- `Mem.md`: collective chronological memory.
- `frontend/AGENTS.md`: version-aware Next.js coding guidance.
- `frontend/CLAUDE.md`: reference to the adjacent frontend guidance.

Implementation tasks remain in `../TASKS.md`; application code remains in `../starters/`.

For AI-assisted work, explicitly load this folder's instructions and the frontend guidance when relevant. These relocated files are not assumed to be automatically discovered by coding tools working outside this folder.

Next.js automatic agent-file generation is disabled via `agentRules: false` so development startup does not recreate AI instruction files inside the frontend project.
