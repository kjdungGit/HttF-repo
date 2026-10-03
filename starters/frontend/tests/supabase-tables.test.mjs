import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const registry = JSON.parse(readFileSync(new URL('../src/utils/supabase/table-registry.json', import.meta.url), 'utf8'));
const source = readFileSync(new URL('../src/utils/supabase/tables.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
const exports = {};
vm.runInNewContext(outputText, { exports, require: () => ({ default: registry }) });
const { createTableFunctions, getTableDefinition } = exports;

function fakeClient(result = { data: [{ id: 'test-id' }], error: null }) {
  const calls = [];
  const query = { then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); } };
  for (const method of ['select', 'limit', 'order', 'eq', 'is', 'insert', 'update', 'delete']) {
    query[method] = (...args) => { calls.push([method, ...args]); return query; };
  }
  const client = { schema(name) { calls.push(['schema', name]); return { from(table) { calls.push(['from', table]); return query; } }; } };
  return { client, calls };
}

test('registry targets exactly the four supplied tables and excludes todos', () => {
  const expected = ['benefit_results', 'checklist_items', 'profiles', 'transactions'];
  assert.deepEqual(Object.keys(registry), expected);
  assert.deepEqual(Object.keys(createTableFunctions(fakeClient().client)), expected);
  assert.throws(() => getTableDefinition('todos'), (error) => error.status === 404);
  assert.throws(() => getTableDefinition('__proto__'), (error) => error.status === 404);
});

test('each table read uses public schema, the correct table, and a bounded limit', async () => {
  for (const name of Object.keys(registry)) {
    const { client, calls } = fakeClient();
    const result = await createTableFunctions(client)[name].read();
    assert.deepEqual(result, [{ id: 'test-id' }]);
    assert.deepEqual(calls.slice(0, 4), [['schema', 'public'], ['from', name], ['select', '*'], ['limit', 100]]);
  }
});

test('writes target only a registered row key and preserve caller client', async () => {
  const { client, calls } = fakeClient();
  const functions = createTableFunctions(client);
  await functions.profiles.update({ id: 'test-id' }, { display_name: 'Synthetic fixture' });
  assert.ok(calls.some((call) => call[0] === 'from' && call[1] === 'profiles'));
  assert.ok(calls.some((call) => call[0] === 'eq' && call[1] === 'id' && call[2] === 'test-id'));
  await functions.transactions.delete({ id: 'test-id' });
  assert.ok(calls.some((call) => call[0] === 'from' && call[1] === 'transactions'));
});

test('unfiltered writes and key changes are rejected before building a query', async () => {
  const { client, calls } = fakeClient();
  const functions = createTableFunctions(client);
  await assert.rejects(functions.profiles.update({}, { name: 'x' }), (error) => error.status === 400);
  await assert.rejects(functions.profiles.delete({ other: 'x' }), (error) => error.code === 'ROW_KEY_REQUIRED');
  await assert.rejects(functions.profiles.update({ id: 'x' }, { id: 'y' }), (error) => error.status === 400);
  assert.equal(calls.length, 0);
});

test('read validation blocks oversized limits and PostgREST expression injection', async () => {
  const functions = createTableFunctions(fakeClient().client);
  await assert.rejects(functions.profiles.read({ limit: 101 }), (error) => error.status === 400);
  await assert.rejects(functions.profiles.read({ columns: ['id,transactions(*)'] }), (error) => error.status === 400);
  await assert.rejects(functions.profiles.read({ where: { id: { nested: true } } }), (error) => error.status === 400);
});

test('insert uses supplied values and database errors are sanitized', async () => {
  const { client, calls } = fakeClient();
  await createTableFunctions(client).checklist_items.insert({ name: 'Synthetic fixture' });
  assert.ok(calls.some((call) => call[0] === 'insert' && call[1].name === 'Synthetic fixture'));
  const denied = createTableFunctions(fakeClient({ data: null, error: { code: '42501', message: 'internal database detail' } }).client);
  await assert.rejects(denied.profiles.read(), (error) => error.status === 403 && !error.message.includes('internal'));
});
