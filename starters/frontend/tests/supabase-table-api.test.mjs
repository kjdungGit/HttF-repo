import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
const require = createRequire(import.meta.url);

function compile(path, dependencies) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const exports = {};
  vm.runInNewContext(outputText, { exports, URL, require: (name) => dependencies[name] ?? require(name) });
  return exports;
}
const origin = compile('../src/utils/supabase/origin.ts', {});
const registry = JSON.parse(readFileSync(new URL('../src/utils/supabase/table-registry.json', import.meta.url), 'utf8'));
const tables = compile('../src/utils/supabase/tables.ts', { './table-registry.json': { default: registry } });
function route(authenticated = false) {
  const calls = [];
  const query = { then(resolve, reject) { return Promise.resolve({ data: [], error: null }).then(resolve, reject); } };
  for (const method of ['select', 'limit', 'order', 'eq', 'is', 'insert', 'update', 'delete']) {
    query[method] = (...args) => { calls.push([method, ...args]); return query; };
  }
  const client = { schema(name) { calls.push(['schema', name]); return { from(name) { calls.push(['from', name]); return query; } }; }, auth: { async getClaims() { return { data: authenticated ? { claims: { sub: 'test-user' } } : null, error: null }; } } };
  const handlers = compile('../src/app/api/database/[table]/route.ts', {
    'next/headers': { cookies: async () => ({}) },
    '@/utils/supabase/server': { createClient: () => client },
    '@/utils/supabase/tables': tables,
    '@/utils/supabase/origin': origin,
  });
  return { handlers, calls };
}
function request(method, body, origin) {
  return new Request('https://example.test/api/database/profiles', { method, headers: { 'Content-Type': 'application/json', ...(origin ? { origin } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
const context = (table = 'profiles') => ({ params: Promise.resolve({ table }) });

test('GET serves a registered table with a private JSON response', async () => {
  const { handlers } = route();
  const response = await handlers.GET(request('GET'), context());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { table: 'profiles', data: [] });
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
});
test('todos and unknown tables are rejected without a database query', async () => {
  const { handlers, calls } = route();
  for (const name of ['todos', 'unknown']) {
    const response = await handlers.GET(request('GET'), context(name));
    assert.equal(response.status, 404);
    assert.equal((await response.json()).error.code, 'UNKNOWN_TABLE');
  }
  assert.equal(calls.length, 0);
});
test('anonymous writes fail before insert or update can run', async () => {
  const { handlers, calls } = route();
  const response = await handlers.POST(request('POST', { values: { name: 'test' } }), context());
  assert.equal(response.status, 401);
  assert.equal(calls.length, 0);
});
test('cross-origin writes are rejected before contacting the table', async () => {
  const { handlers, calls } = route(true);
  const response = await handlers.POST(request('POST', { values: { name: 'test' } }, 'https://other.test'), context());
  assert.equal(response.status, 403);
  assert.equal(calls.length, 0);
});
test('authenticated inserts use route table and return 201', async () => {
  const { handlers, calls } = route(true);
  const response = await handlers.POST(request('POST', { values: { name: 'Synthetic fixture' } }), context('checklist_items'));
  assert.equal(response.status, 201);
  assert.ok(calls.some((call) => call[0] === 'from' && call[1] === 'checklist_items'));
});
test('unfiltered delete requests cannot run a database mutation', async () => {
  const { handlers, calls } = route(true);
  const response = await handlers.DELETE(request('DELETE', { key: {} }), context());
  assert.equal(response.status, 400);
  assert.equal(calls.length, 0);
});
