import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as extraction from '../src/utils/pdf/tax-extraction.mjs';

function moduleFrom(file, dependencies) {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const exports = {};
  vm.runInNewContext(outputText, { exports, require: name => dependencies[name], Response, Request, URL, File, FormData, Buffer, Uint8Array });
  return exports;
}
const fixture = readFileSync(new URL('./fixtures/pdf/1040-es.pdf', import.meta.url));
function uploadRequest(bytes = fixture, name = 'tax.pdf') {
  const data = new FormData(); data.append('file', new File([bytes], name, { type: 'application/pdf' }));
  return new Request('http://localhost/api/documents/upload', { method: 'POST', body: data });
}
function route(file, client) {
  return moduleFrom(file, {
    '@/utils/pdf/document-request': { documentClient: client, documentSession: async request => ({ client: await client(request), user: { id: 'verified-owner' } }), documentError: error => Response.json({ error: { code: error.code } }, { status: error.status ?? 503 }) },
    '@/utils/pdf/tax-extraction.mjs': extraction,
  });
}

test('multipart upload route extracts actual Spanish PDF and returns a private review draft', async () => {
  const { POST } = route('../src/app/api/documents/upload/route.ts', async () => ({}));
  const response = await POST(uploadRequest());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  const body = await response.json();
  assert.equal(body.userId, 'verified-owner');
  assert.equal(body.extraction.language, 'es');
  assert.equal(body.extraction.fields.wages, '42000.25');
});

test('upload rejects an unsigned user before parsing and rejects non-PDF selection', async () => {
  const denied = route('../src/app/api/documents/upload/route.ts', async () => { throw new extraction.DocumentError('AUTH_REQUIRED', 401, 'Sign in'); });
  assert.equal((await denied.POST(uploadRequest())).status, 401);
  const allowed = route('../src/app/api/documents/upload/route.ts', async () => ({}));
  assert.equal((await allowed.POST(uploadRequest(Buffer.from('photo'), 'photo.png'))).status, 400);
});

test('save route uses confirmed canonical fields and atomic RPC without a caller-selected owner', async () => {
  const draft = await extraction.extractTaxPdf(fixture);
  const calls = [];
  const { POST } = route('../src/app/api/documents/save/route.ts', async () => ({ rpc: async (...args) => { calls.push(args); return { data: draft.recordId, error: null }; } }));
  const request = new Request('http://localhost/api/documents/save', { method: 'POST', body: JSON.stringify({ ...draft, confirmed: true, user_id: 'someone-else' }) });
  const response = await POST(request);
  assert.equal(response.status, 201);
  assert.equal(calls[0][0], 'append_profile_tax_form');
  assert.equal(calls[0][1].target_column, 'form_1040');
  assert.equal(calls[0][1].form_record.fields.wages, '42000.25');
  assert.equal(calls[0][1].form_record.user_id, undefined);
  assert.equal(calls[0][1].form_record.id, draft.recordId);
});

test('save failures retain an actionable error and unconfirmed data never reaches RPC', async () => {
  let calls = 0;
  const draft = await extraction.extractTaxPdf(fixture);
  const { POST } = route('../src/app/api/documents/save/route.ts', async () => ({ rpc: async () => { calls++; return { error: { code: 'PGRST202' } }; } }));
  const request = body => new Request('http://localhost/api/documents/save', { method: 'POST', body: JSON.stringify(body) });
  assert.equal((await POST(request(draft))).status, 400);
  assert.equal(calls, 0);
  assert.equal((await POST(request({ ...draft, confirmed: true }))).status, 503);
});

test('document authentication helper checks origin and validates the real current user', async () => {
  let lookups = 0;
  const authModule = moduleFrom('../src/utils/pdf/document-request.ts', {
    'next/headers': { cookies: async () => ({}) },
    '@/utils/supabase/server': { createClient: () => ({ auth: { getUser: async () => { lookups++; return { data: { user: null }, error: null }; } } }) },
    './tax-extraction.mjs': extraction,
    '@/utils/supabase/origin': moduleFrom('../src/utils/supabase/origin.ts', {}),
  });
  await assert.rejects(authModule.documentClient(new Request('http://localhost/api/documents/upload', { method: 'POST', headers: { origin: 'https://foreign.test' } })), error => error.status === 403);
  assert.equal(lookups, 0);
  await assert.rejects(authModule.documentClient(new Request('http://localhost/api/documents/upload', { method: 'POST' })), error => error.status === 401);
  assert.equal(lookups, 1);
});
