# Database review — 2026-10-03

Based on the supplied CREATE TABLE SQL and current application usage. Live publishable-key reads succeeded for all four tables but exposed zero rows under the anonymous session. That does not establish whether the database is empty. The schema discovery endpoint returned 401, so supplied columns, constraints, policies, and triggers are reviewed as provided rather than claimed as independently verified deployments. No database data or schema was changed.

## Candidates to remove from the current demo scope

| Table/columns | Recommendation | Reason |
| --- | --- | --- |
| `transactions` (entire table) | Strongest optional table; retain only if transaction-based insights or sandbox persona data are part of the pitch | No transaction import, merchant view, or transaction-backed calculation exists in the current frontend. Its generic CRUD endpoint alone does not demonstrate a product need. |
| `profiles.tax_year`, `profiles.state` | Optional for a strictly fixed 2025 Illinois demo | The UI currently fixes this context. Keep these fields if users can select other years/states or results need durable context. |
| `profiles.household_info` and `profiles.filing_status` | Check for duplication before populating | Household JSON could repeat filing status. Give the JSON a defined shape and store filing status in one canonical place. No actual duplicate data was visible. |
| `checklist_items.source_url` | Optional if checklist entries never cite external requirements | Useful if users need authoritative document guidance; otherwise currently unused. |
| `transactions.merchant_name`, `transactions.tax_category` | Optional if retaining only a basic cash-flow demo | Keep for merchant display or tax categorization; neither is currently implemented. Removing the whole out-of-scope table is clearer than trimming fields without a defined feature. |

No column is proven redundant from the schema alone. These are scope-dependent candidates, not deletion instructions.

## Keep

- `profiles`: needed by all three child-table foreign keys and the signup trigger. Keep `id`; it connects Auth identity to application data. `preferred_language` and `accessibility_prefs` support the accessibility objective even though the frontend does not yet apply them.
- `checklist_items`: directly matches checklist progress. Keep `id`, `user_id`, `title`, `status`, and `why_needed` for ownership, state, and understandable instructions.
- `benefit_results`: matches eligibility explanations. Keep `benefit_key`, `status`, `evidence`, `explanation`, and `source_url` if eligibility is delivered: evidence and citations support understandable, trustworthy results.
- Ownership keys, timestamps, foreign keys, and RLS policies: retain. Username-only anonymous Auth users still have distinct UUIDs. Names are labels, never ownership keys.

## Gaps that matter more than pruning

The current GuidePage holds answers, uploaded File objects, and completion state in component memory. It does not call the database endpoints. Therefore all four public tables currently lack a product-facing persistence integration, even though generic CRUD helpers exist. Reload loses guide progress.

The supplied Auth trigger creates profiles automatically. Verify that it is deployed and fires for anonymous signup before testing checklist/benefit inserts, because their user_id foreign keys depend on that profile. Do not add a second unconditional profile insert in the signup helper.

If checklist or eligibility logic reruns, define whether records are historical or current. Current-result storage may need a unique user/benefit key or stable checklist key to prevent duplicate rows. This is a design choice, not an existing unused column.

Anonymous Sign-Ins are currently disabled: the real account-creation request fails before a user/profile can be created. Simulated tests verify the flow but cannot prove live trigger or authenticated RLS behavior. Enable the provider, then verify a guest sees only its own profile/results/checklist rows. Signing out loses access to that guest account through this username-only UI.
