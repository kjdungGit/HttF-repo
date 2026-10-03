# Server-side Supabase table functions and API

Next.js hosts these Node/server functions. Pages, layouts, styles, and React components are unchanged. No browser Supabase helper is included; session refresh runs only for `/api/*`.

## Registered tables

The registry in `src/utils/supabase/table-registry.json` contains only these supplied and API-verified tables in `public`:

- `benefit_results`
- `checklist_items`
- `profiles`
- `transactions`

All four table reads and their `id` columns were verified against the live REST API. Anonymous reads returned no visible rows; that may reflect empty tables or RLS. Full column types and constraints are not available with the publishable key. Helpers validate identifier syntax and let Supabase validate actual columns/types. `id` is the configured row lookup column; its uniqueness/primary-key constraint has not been independently inspected.

The nonexistent todos helper and endpoint were removed. Unregistered table requests are rejected before executing a database query.

## Node/server usage

```ts
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { createTableFunctions } from '@/utils/supabase/tables';

const supabase = createClient(await cookies());
const db = createTableFunctions(supabase);

await db.benefit_results.read({ limit: 25 });
await db.checklist_items.read({ columns: ['id'], limit: 25 });
await db.profiles.read({ where: { id: userId } });
await db.transactions.read({ limit: 25 });

// Inside a verified-user route/server action, use actual table column values:
await db.checklist_items.insert(values);
await db.checklist_items.update({ id: itemId }, updates);
await db.checklist_items.delete({ id: itemId });
```

Each table gets `read`, `insert`, `update`, and `delete` functions. Queries retain the supplied client's session and RLS permissions; no admin/service-role key is used. Direct server callers must enforce their own authentication before mutations. Empty updates, missing row keys, and row-key changes are rejected. Reads are capped at 100 rows.

## HTTP API

| Method/path | Request | Result |
| --- | --- | --- |
| `GET /api/database` | None | Registered table names |
| `GET /api/database/{table}` | Optional `?limit=25&columns=id` | `{ table, data: [...] }` |
| `POST /api/database/{table}` | `{ "values": { ...actualColumns } }` | Inserted rows, HTTP 201 |
| `PATCH /api/database/{table}` | `{ "key": { "id": "row-id" }, "values": { ...actualColumns } }` | Updated rows |
| `DELETE /api/database/{table}` | `{ "key": { "id": "row-id" } }` | Deleted rows |

Send JSON and the existing session cookie for writes. Writes require verified auth claims, reject cross-origin browser requests, and remain subject to RLS. Rows written with return representation also need appropriate SELECT access. Unknown tables return 404; missing sessions return 401; invalid inputs return 400. Internal database details are not returned. Responses are private/no-store.

## Configuration and verification

Run from `starters/frontend`: `npm ci`, then `npm run dev -- --hostname 0.0.0.0 --port 3000`. Supplied server-only values are already in ignored `.env.local`: `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Use `.env.example` only when configuration is missing. Node.js 24 needs `NODE_USE_ENV_PROXY=1` in proxy-backed cloud environments.

Run `npm test`, `npm run lint`, `npx --no-install tsc --noEmit`, and `npm run build`. Tests cover registry targeting, bounded reads, key-scoped writes, rejected anonymous/cross-origin writes, sanitized errors, and session cookies. Live writes/RLS authorization have not been verified: tests use controlled responses and no production rows were modified.

## User/account helpers

`src/utils/supabase/users.ts` exports `createUserFunctions(supabase)` with `createUser`, `signIn`, `signOut`, `getCurrentUser`, `requestPasswordReset`, `updateUser`, `confirmEmail`, and `exchangeCode`. Use a request-scoped server client so Supabase can persist sessions to SSR cookies.

| Endpoint | Method | JSON body |
| --- | --- | --- |
| `/api/auth/signup` | POST | `{ "email": "...", "password": "...", "displayName": "optional" }` |
| `/api/auth/login` | POST | `{ "email": "...", "password": "..." }` |
| `/api/auth/logout` | POST | None; signs out current session |
| `/api/auth/user` | GET | None; returns verified current user or 401 |
| `/api/auth/user` | PATCH | Any of `email`, `password`, `displayName`; requires signed-in user |
| `/api/auth/reset-password` | POST | `{ "email": "..." }` |
| `/api/auth/confirm` | POST | `{ "tokenHash": "...", "type": "signup" }`; also accepts `email`, `recovery`, `email_change` |
| `/api/auth/exchange-code` | POST | `{ "code": "..." }`; consumes a PKCE code with its cookie verifier |

Successful signup returns HTTP 201 with limited user fields and `confirmationRequired`. Confirmation settings are controlled by Supabase; signup does not bypass them. API bodies never return access/refresh tokens. New passwords require at least 8 characters; provider requirements also apply. Reset requests return a generic eligibility message. Configure allowed site/redirect URLs and email templates in Supabase; a backend caller must submit the callback token/code to the corresponding helper endpoint. No sign-in UI or automatic redirect is introduced.

Current-user lookup validates against `auth.getUser()`. Account updates cannot assign roles or arbitrary metadata. These helpers use Supabase Auth's `auth.users`; they do not automatically insert a row into `public.profiles` or any other application table. Provisioning profiles depends on your verified table schema or existing database triggers. No admin-user management or service-role key is required for these self-service helpers.

User-helper tests cover validation before SDK calls, pending confirmation, token omission, verified account updates, local logout, OTP/PKCE delegation, and sanitized rate-limit errors. They use controlled responses; creating additional production accounts or sending live password-reset emails is not part of the implementation check.
