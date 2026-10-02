# Preloaded starters

Independent starter projects kept in this repository. Dependencies are installed; no credentials or database are required.

## Frontend

```sh
cd /workspace/tailwind-nodejs-template/starters/frontend
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Next.js, React, TypeScript, Tailwind CSS. Edit `src/app/page.tsx`.
Validate with `npm run build`, `npm run lint`, and `npx --no-install tsc --noEmit`.

## Node backend

```sh
cd /workspace/tailwind-nodejs-template/starters/backend-node
npm run dev
```

Uses Node's built-in HTTP server, with no external dependencies. Port 4000 by default; set `PORT` to override. `GET /health` returns `{"status":"ok"}`; other routes return 404.

## FastAPI backend

```sh
cd /workspace/tailwind-nodejs-template/starters/backend-fastapi
.venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

`GET /health` returns `{"status":"ok"}`. OpenAPI schema is at `/openapi.json` and interactive documentation at `/docs`.
Dependencies are pinned in `requirements.txt`; refresh intentionally from `requirements.in`.

## Reinstall

Use Node.js 24 and Python 3.12. Set `npm_config_cache=/workspace/.npm-cache` when installing, then run `npm ci` in each Node project. In the FastAPI directory run `python -m venv .venv` and `.venv/bin/python -m pip install --no-cache-dir -r requirements.txt`.

These are minimal independent starters. Authentication, persistence, and frontend/backend integration can be added for a specific application.
