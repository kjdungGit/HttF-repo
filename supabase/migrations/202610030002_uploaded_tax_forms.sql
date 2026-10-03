-- Apply after 202610030001_profile_tax_forms.sql.
-- Atomic, ownership-scoped appends for confirmed uploaded forms.
begin;
alter table public.profiles
  add column if not exists form_8962 jsonb not null default '[]'::jsonb,
  add column if not exists schedule_1 jsonb not null default '[]'::jsonb,
  add column if not exists schedule_2 jsonb not null default '[]'::jsonb,
  add column if not exists schedule_3 jsonb not null default '[]'::jsonb,
  add column if not exists schedule_il_m jsonb not null default '[]'::jsonb,
  add column if not exists schedule_il_nr jsonb not null default '[]'::jsonb,
  add column if not exists schedule_il_wit jsonb not null default '[]'::jsonb;

create or replace function public.append_profile_tax_form(target_column text, form_record jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  record_id uuid := (form_record->>'id')::uuid;
  updated_count integer;
begin
  if owner_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if target_column is null or target_column <> all (array['form_1040', 'form_2441', 'form_8812', 'form_8863', 'form_8880', 'form_8962', 'form_il_1040', 'schedule_1', 'schedule_1_a', 'schedule_2', 'schedule_3', 'schedule_il_e_eitc', 'schedule_il_icr', 'schedule_il_m', 'schedule_il_nr', 'schedule_il_wit']) then raise exception 'Unsupported tax-form column'; end if;
  if record_id is null or jsonb_typeof(form_record) is distinct from 'object' or jsonb_typeof(form_record->'fields') is distinct from 'object' or octet_length(form_record::text) > 65536 then raise exception 'Invalid form record'; end if;
  -- Lock the user's row; parallel uploads preserve prior arrays. Retried IDs do not duplicate.
  execute format('update public.profiles set %1$I = case when %1$I @> jsonb_build_array(jsonb_build_object(''id'', $2->>''id'')) then %1$I else %1$I || jsonb_build_array($2) end where id = $1', target_column) using owner_id, form_record;
  get diagnostics updated_count = row_count;
  if updated_count <> 1 then raise exception 'Profile unavailable' using errcode = '42501'; end if;
  return record_id;
end $$;

revoke all on function public.append_profile_tax_form(text, jsonb) from public;
revoke all on function public.append_profile_tax_form(text, jsonb) from anon;
grant execute on function public.append_profile_tax_form(text, jsonb) to authenticated;

commit;
