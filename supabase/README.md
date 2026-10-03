# Profile tax-form storage

Migration `migrations/202610030001_profile_tax_forms.sql` adds form columns to the existing `public.profiles` table. It is prepared locally and has NOT been applied to the live Supabase project. Run the entire file in the project's Supabase SQL Editor, or use your authenticated Supabase CLI migration workflow.

Columns cover the guide's current forms:

- `form_w2`, `form_1099_nec`, `form_1099_k`, `form_1099_misc`, `form_1099_int`, `form_1099_g`
- `form_1098_e`, `form_1098_t`, `form_1040`, `form_il_1040`, `form_4852`
- `form_8812`, `form_8880`, `form_2441`, `form_8863`
- `schedule_eic`, `schedule_il_e_eitc`, `schedule_il_icr`, `schedule_1_a`

Each is a non-null JSON array defaulting to `[]`. Multiple employers, issuers, copies, and years can coexist. Defaults also apply to newly created profiles from the existing Auth trigger. Existing ownership RLS continues to apply; this migration does not replace policies or triggers. IL-E/EITC is grouped as referenced by the current guide.

Suggested record shape (application convention; SQL checks the outer array only):

```json
[
  {
    "tax_year": 2025,
    "status": "received",
    "issuer": "Demo employer",
    "fields": { "box_1_wages": "42000.00", "box_2_federal_withholding": "3500.00" }
  }
]
```

Use `fields` for confirmed form values and decimal strings for money. Suggested status values: `needed`, `received`, `reviewed`. Store file references only as optional `storage_path` values to private storage; these columns do not upload or protect files themselves. Avoid adding SSNs or raw document contents to the demo. Saved data is preparation information, not a submitted return.

After applying, existing backend endpoints support the columns without frontend edits:

```http
PATCH /api/database/profiles
Content-Type: application/json
Cookie: <signed-in browser session>

{
  "key": { "id": "<current-auth-user-uuid>" },
  "values": {
    "form_w2": [{ "tax_year": 2025, "status": "received", "fields": { "box_1_wages": "42000.00" } }]
  }
}
```

Read with `GET /api/database/profiles?columns=id,form_w2,form_1040,form_il_1040`. RLS limits visibility to the signed-in user's profile. Updates replace the entire column array: read/merge existing records before saving; simultaneous writers need a separate atomic-update design. The current UI does not yet persist uploaded documents or guide answers through these endpoints.

Verify deployment in SQL Editor:

```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
  and (column_name like 'form_%' or column_name like 'schedule_%')
order by column_name;
```

Expect 19 jsonb columns. Then verify writes using a signed-in user's profile and confirm another user cannot read or modify it. Live username sign-in also requires enabling Supabase Anonymous Sign-Ins first.

## Uploaded form recording

Apply `202610030001_profile_tax_forms.sql`, then `202610030002_uploaded_tax_forms.sql`. The second migration adds additional return/schedule columns and the `append_profile_tax_form` RPC. It appends to the current `auth.uid()` profile atomically, preserves previous records, and treats a retry with the same record UUID as already recorded. It cannot write another user's profile or a caller-selected arbitrary column. Existing profile RLS and the Auth signup trigger remain necessary.

`Record forms` sends each reviewed document to `POST /api/documents/save`. The backend validates canonical numeric keys, derives the destination column from its own template registry, and invokes the RPC. A partial failure preserves failed reviews so the button can retry them without resending successfully recorded forms.

Both migrations executed successfully in an isolated PGlite PostgreSQL environment with simulated auth roles and RLS. Ownership, separate records, retry deduplication, missing profiles, unauthenticated access, and disallowed columns were checked. This is local verification, not deployment to Supabase.
