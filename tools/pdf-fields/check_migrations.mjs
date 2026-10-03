// Local PostgreSQL/WASM verification, never connects to Supabase.
// PGLITE_MODULE=/absolute/path/@electric-sql/pglite/dist/index.js node tools/pdf-fields/check_migrations.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
await db.exec(`
 create role anon; create role authenticated;
 create schema auth;
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated;
 create table public.profiles(id uuid primary key);
 alter table public.profiles enable row level security;
 create policy own_profile on public.profiles for all using(auth.uid()=id) with check(auth.uid()=id);
 grant select,update on public.profiles to authenticated;
`);
for(const file of ['202610030001_profile_tax_forms.sql','202610030002_uploaded_tax_forms.sql']) await db.exec(fs.readFileSync(new URL('../../supabase/migrations/'+file,import.meta.url),'utf8'));
const owner=randomUUID(),other=randomUUID();
await db.query('insert into public.profiles(id) values($1),($2)',[owner,other]);
await db.exec('set role authenticated');
await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);
const record = {id:randomUUID(),tax_year:2025,status:'reviewed',fields:{wages:'42000.00'}};
const append = value => db.query('select public.append_profile_tax_form($1,$2::jsonb)',['form_1040',JSON.stringify(value)]);
await append(record);await append(record);await append({...record,id:randomUUID(),fields:{wages:'100.00'}});
let rows=await db.query('select id,form_1040 from public.profiles');
assert.equal(rows.rows.length,1);assert.equal(rows.rows[0].id,owner);assert.equal(rows.rows[0].form_1040.length,2);
await assert.rejects(db.query('select public.append_profile_tax_form($1,$2::jsonb)',['id',JSON.stringify(record)]));
await db.query("select set_config('request.jwt.claim.sub',$1,false)",[other]);
rows=await db.query('select form_1040 from public.profiles');assert.equal(rows.rows.length,1);assert.equal(rows.rows[0].form_1040.length,0);
await db.query("select set_config('request.jwt.claim.sub',$1,false)",[randomUUID()]);await assert.rejects(append(record));
await db.query("select set_config('request.jwt.claim.sub','',false)");await assert.rejects(append(record));
await db.exec('reset role; set role anon');await assert.rejects(append(record));
await db.close();
console.log('PASS: both migrations execute; owner-scoped appends preserve records, retries are idempotent, RLS isolates profiles, missing/unsigned profiles and unapproved columns are rejected.');
