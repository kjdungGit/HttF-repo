# Server-side Supabase API

The existing Next.js app hosts backend route handlers. Its page, layout, styles, and React components are unchanged. There is no browser Supabase helper. Session refresh runs only for `/api/*` requests.

Run commands from `starters/frontend`:

```sh
npm ci
# Copy .env.example to .env.local only if .env.local is missing, then configure it.
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Server-only variables are `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. The supplied project values are already in the ignored `.env.local`. No service-role key is used. In a cloud environment requiring HTTP(S)_PROXY, Node.js 24 should start with `NODE_USE_ENV_PROXY=1`.

## Request

```sh
curl http://localhost:3000/api/todos
```

`GET /api/todos` returns `{ "todos": [{ "id": 1, "name": "Example" }] }`, or `{ "todos": [] }` when no rows are visible. Reads select `id, name`, order by `id`, and return at most 100 rows. The response is private and not cached. Caller session cookies and Supabase row-level security determine access. No write endpoint or schema modification is included.

Database errors return HTTP 503 with `{ "error": { "code": "TODOS_UNAVAILABLE", "message": "Unable to retrieve todos." } }`. Setup/unexpected failures return HTTP 500 with `REQUEST_FAILED`. Internal database details are not returned to callers.

The project previously returned `PGRST205`: `todos` was not available through the API. The table must expose `id` and `name` and have SELECT policies appropriate to the intended visitors before live reads succeed. An empty response can also mean RLS hides rows from the caller.

## Helpers and validation

- `src/utils/supabase/server.ts`: request-scoped server client.
- `src/utils/supabase/config.ts`: server environment configuration.
- `src/utils/supabase/todos.ts`: bounded read helper.
- `src/utils/supabase/middleware.ts` and `src/proxy.ts`: auth refresh, cookie propagation, and cache headers for API requests.

Run `npm test`, `npm run lint`, `npx --no-install tsc --noEmit`, and `npm run build`. Tests use controlled auth/database responses and real Next.js response/cookie primitives; they do not claim a real authenticated refresh or successful live table query.
