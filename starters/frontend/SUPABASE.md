# Supabase repair on adc36e0

This branch is based on adc36e042f2a2993a92b6ee542d1520238f5edfb. Its interface, API routes, PDF processing and existing profile-array form storage are retained.

The old local guest-cookie fallback has been removed. Username access now requires a real Supabase anonymous Auth session. A profiles row is inserted or verified before successful sign-in. If Auth succeeds but profile persistence fails, the UI reports failure; retrying reuses the existing Auth identity and repairs the profile. Tokens remain in session cookies and are omitted from response JSON.

Enable **Authentication → Sign In / Providers → Anonymous Sign-Ins** in the Supabase dashboard. Live verification returned `anonymous_provider_disabled`; this setting cannot be enabled with the public application key.

The tracked `.env.local` retains the original public URL and publishable key. Do not put a service-role key in the browser or shared file. Cloud Node24 fetch through a proxy needs `NODE_USE_ENV_PROXY=1` when starting the process.

Apply the SQL files in `supabase/migrations` as needed: the existing 001 and 002 migrations provide form arrays and append_profile_tax_form; the new 003 migration makes automatic profile creation idempotent. It requires the original profiles schema and owner RLS policies. No new tax_forms table is introduced; uploaded form records continue to use the existing profile JSON arrays.

From `starters/frontend`: `npm ci`, `npm run dev`. Production: `npm run build`, `npm start`. Checks: `npm test`, `npm run lint`, `npm run build`.

Username alone does not recover an account across devices or after logout; it labels a guest account. Preserving the authenticated browser session preserves that identity. No fallback should report a local session as a database account.
