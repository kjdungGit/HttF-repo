import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { readSavedForms, savedFormsFromProfile } from '../src/utils/pdf/profile-forms.mjs';

const record = { id: 'saved-1040', tax_year: 2025, language: 'es', fields: { wages: '42000.25', unknown: null } };
test('saved forms include existing payer forms and bilingual returns but omit unrelated profile information', () => {
  const result = savedFormsFromProfile({ id: 'owner', household_info: { secret: 'private' }, form_1040: [record, record], form_w2: [{ tax_year: 2025, fields: { box_1_wages: '42000' } }] });
  assert.equal(result.length, 2);
  assert.equal(result.find(form => form.id === record.id).language, 'es');
  assert.equal(result.find(form => form.formType === 'w2').fields.box_1_wages, '42000');
  assert.doesNotMatch(JSON.stringify(result), /household|private|owner/);
});
test('legacy entries get stable IDs and malformed nested records are not rendered as fields', () => {
  const profile = { form_1040: [null, [], 1, { fields: { nested: { secret: 'hidden' }, amount: 12, valid: '123' } }] };
  const first = savedFormsFromProfile(profile);
  assert.deepEqual(first, savedFormsFromProfile(profile));
  assert.equal(first.length, 1);
  assert.equal(first[0].taxYear, null);
  assert.deepEqual(first[0].fields, { amount: 12, valid: '123' });
  assert.deepEqual(savedFormsFromProfile(null), []);
});
function clientFor(data, error = null) {
  const calls = [];
  const builder = { select: value => { calls.push(['select', value]); return builder; }, eq: (...args) => { calls.push(['eq', ...args]); return builder; }, maybeSingle: async () => ({ data, error }) };
  return { calls, client: { schema: name => { calls.push(['schema', name]); return { from: table => { calls.push(['from', table]); return builder; } }; } } };
}
test('profile lookup filters by verified owner before returning only saved forms', async () => {
  const { client, calls } = clientFor({ form_1040: [record] });
  const result = await readSavedForms(client, 'verified-owner');
  assert.equal(result.userId, 'verified-owner');
  assert.equal(result.forms.length, 1);
  assert.deepEqual(calls, [['schema', 'public'], ['from', 'profiles'], ['select', '*'], ['eq', 'id', 'verified-owner']]);
  await assert.rejects(readSavedForms(client, ''), error => error.status === 401);
});
test('missing profiles give an empty list and database failures stay explicit', async () => {
  assert.deepEqual(await readSavedForms(clientFor(null).client, 'owner'), { userId: 'owner', forms: [] });
  await assert.rejects(readSavedForms(clientFor(null, { code: 'permission-denied' }).client, 'owner'), error => error.code === 'SAVED_FORMS_UNAVAILABLE');
});
test('saved list API ignores requested owner IDs and disables caching', async () => {
  const source = readFileSync(new URL('../src/app/api/documents/route.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const exports = {};
  let selected;
  vm.runInNewContext(outputText, { exports, Response, require: name => name.endsWith('document-request') ? {
    documentSession: async () => ({ client: {}, user: { id: 'verified-owner' } }),
    documentError: error => Response.json({ error: error.code }, { status: error.status ?? 503 }),
  } : { readSavedForms: async (_, owner) => { selected = owner; return { userId: owner, forms: [] }; } } });
  const response = await exports.GET(new Request('http://localhost/api/documents?userId=someone-else'));
  assert.equal(selected, 'verified-owner');
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(await response.json(), { userId: 'verified-owner', forms: [] });
});
