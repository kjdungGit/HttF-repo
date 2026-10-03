-- Profile storage for the forms currently referenced by the KEENFinance guide.
-- Each column contains an array so multiple issuers and tax years are supported.
-- Existing profiles, ownership policies, and signup defaults are preserved.
begin;

alter table public.profiles
  add column if not exists form_w2 jsonb not null default '[]'::jsonb,
  add column if not exists form_1099_nec jsonb not null default '[]'::jsonb,
  add column if not exists form_1099_k jsonb not null default '[]'::jsonb,
  add column if not exists form_1099_misc jsonb not null default '[]'::jsonb,
  add column if not exists form_1099_int jsonb not null default '[]'::jsonb,
  add column if not exists form_1099_g jsonb not null default '[]'::jsonb,
  add column if not exists form_1098_e jsonb not null default '[]'::jsonb,
  add column if not exists form_1098_t jsonb not null default '[]'::jsonb,
  add column if not exists form_1040 jsonb not null default '[]'::jsonb,
  add column if not exists form_il_1040 jsonb not null default '[]'::jsonb,
  add column if not exists form_4852 jsonb not null default '[]'::jsonb,
  add column if not exists form_8812 jsonb not null default '[]'::jsonb,
  add column if not exists form_8880 jsonb not null default '[]'::jsonb,
  add column if not exists form_2441 jsonb not null default '[]'::jsonb,
  add column if not exists form_8863 jsonb not null default '[]'::jsonb,
  add column if not exists schedule_eic jsonb not null default '[]'::jsonb,
  add column if not exists schedule_il_e_eitc jsonb not null default '[]'::jsonb,
  add column if not exists schedule_il_icr jsonb not null default '[]'::jsonb,
  add column if not exists schedule_1_a jsonb not null default '[]'::jsonb;

-- Reject objects/scalars at the outer level; individual form fields remain flexible.
do $$
declare
  column_name text;
  constraint_name text;
begin
  foreach column_name in array array['form_w2', 'form_1099_nec', 'form_1099_k', 'form_1099_misc', 'form_1099_int', 'form_1099_g', 'form_1098_e', 'form_1098_t', 'form_1040', 'form_il_1040', 'form_4852', 'form_8812', 'form_8880', 'form_2441', 'form_8863', 'schedule_eic', 'schedule_il_e_eitc', 'schedule_il_icr', 'schedule_1_a'] loop
    constraint_name := 'profiles_' || column_name || '_array_check';
    if not exists (select 1 from pg_constraint where conrelid = 'public.profiles'::regclass and conname = constraint_name) then
      execute format('alter table public.profiles add constraint %I check (jsonb_typeof(%I) = ''array'')', constraint_name, column_name);
    end if;
  end loop;
end $$;

comment on column public.profiles.form_w2 is 'Array of form w2 records: tax_year, status, issuer, fields, optional storage_path. Empty array means none saved.';
comment on column public.profiles.form_1099_nec is 'Array of form 1099 nec records: tax_year, status, issuer, fields, optional storage_path. Empty array means none saved.';
comment on column public.profiles.form_1099_k is 'Array of form 1099 k records: tax_year, status, issuer, fields, optional storage_path. Empty array means none saved.';
comment on column public.profiles.form_1099_misc is 'Array of form 1099 misc records: tax_year, status, issuer, fields, optional storage_path. Empty array means none saved.';
comment on column public.profiles.form_1099_int is 'Array of form 1099 int records: tax_year, status, issuer, fields, optional storage_path. Empty array means none saved.';
comment on column public.profiles.form_1099_g is 'Array of form 1099 g records: tax_year, status, issuer, fields, optional storage_path. Empty array means none saved.';
comment on column public.profiles.form_1098_e is 'Array of form 1098 e records: tax_year, status, issuer, fields, optional storage_path. Empty array means none saved.';
comment on column public.profiles.form_1098_t is 'Array of form 1098 t records: tax_year, status, issuer, fields, optional storage_path. Empty array means none saved.';
comment on column public.profiles.form_1040 is 'Array of form 1040 records: tax_year, status, issuer, fields, optional storage_path. Empty array means none saved.';
comment on column public.profiles.form_il_1040 is 'Array of form il 1040 records: tax_year, status, issuer, fields, optional storage_path. Empty array means none saved.';
comment on column public.profiles.form_4852 is 'Array of form 4852 records: tax_year, status, issuer, fields, optional storage_path. Empty array means none saved.';
comment on column public.profiles.form_8812 is 'Array of form 8812 records: tax_year, status, issuer, fields, optional storage_path. Empty array means none saved.';
comment on column public.profiles.form_8880 is 'Array of form 8880 records: tax_year, status, issuer, fields, optional storage_path. Empty array means none saved.';
comment on column public.profiles.form_2441 is 'Array of form 2441 records: tax_year, status, issuer, fields, optional storage_path. Empty array means none saved.';
comment on column public.profiles.form_8863 is 'Array of form 8863 records: tax_year, status, issuer, fields, optional storage_path. Empty array means none saved.';
comment on column public.profiles.schedule_eic is 'Array of schedule eic records: tax_year, status, issuer, fields, optional storage_path. Empty array means none saved.';
comment on column public.profiles.schedule_il_e_eitc is 'Array of schedule il e eitc records: tax_year, status, issuer, fields, optional storage_path. Empty array means none saved.';
comment on column public.profiles.schedule_il_icr is 'Array of schedule il icr records: tax_year, status, issuer, fields, optional storage_path. Empty array means none saved.';
comment on column public.profiles.schedule_1_a is 'Array of schedule 1 a records: tax_year, status, issuer, fields, optional storage_path. Empty array means none saved.';

commit;
