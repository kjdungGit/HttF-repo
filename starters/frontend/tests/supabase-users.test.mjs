import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
const source = readFileSync(new URL('../src/utils/supabase/users.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
const exports = {};
vm.runInNewContext(outputText, { exports });
const { createUserFunctions } = exports;
const user = { id: 'fixture-user', email: 'fixture@example.com', user_metadata: { display_name: 'Fixture', role: 'admin' } };
function fixture(overrides = {}) {
  const calls = [];
  const auth = {};
  for (const name of ['signUp', 'signInWithPassword', 'signOut', 'getUser', 'resetPasswordForEmail', 'updateUser', 'verifyOtp', 'exchangeCodeForSession']) {
    auth[name] = async (...args) => { calls.push([name, ...args]); return overrides[name] ?? { data: { user, session: { access_token: 'secret-fixture-token' } }, error: null }; };
  }
  return { users: createUserFunctions({ auth }), calls };
}

test('signup creates a user with allowed metadata and reports confirmation without leaking credentials', async () => {
  const { users, calls } = fixture({ signUp: { data: { user, session: null }, error: null } });
  const result = await users.createUser({ email: 'fixture@example.com', password: 'ValidPassword123!', displayName: 'Fixture', role: 'admin' });
  assert.equal(result.confirmationRequired, true);
  assert.equal(result.user.id, 'fixture-user');
  assert.equal(calls[0][1].options.data.display_name, 'Fixture');
  assert.equal(calls[0][1].options.data.role, undefined);
  assert.doesNotMatch(JSON.stringify(result), /password|access_token|admin/);
});
test('invalid signup inputs fail before contacting Supabase', async () => {
  const { users, calls } = fixture();
  await assert.rejects(users.createUser({ email: 'invalid', password: 'ValidPassword123!' }), (error) => error.status === 400);
  await assert.rejects(users.createUser({ email: 'fixture@example.com', password: 'short' }), (error) => error.status === 400);
  assert.equal(calls.length, 0);
});
test('login returns sanitized user and logout revokes only the current session', async () => {
  const { users, calls } = fixture();
  const result = await users.signIn({ email: 'fixture@example.com', password: 'ValidPassword123!' });
  assert.doesNotMatch(JSON.stringify(result), /secret-fixture-token|access_token/);
  await users.signOut();
  assert.equal(calls[1][1].scope, 'local');
});
test('account updates validate the existing user and cannot edit roles', async () => {
  const { users, calls } = fixture();
  await assert.rejects(users.updateUser({ role: 'admin' }), (error) => error.status === 400);
  await users.updateUser({ displayName: 'Updated fixture' });
  assert.deepEqual(calls.map((call) => call[0]), ['getUser', 'updateUser']);
  assert.equal(calls[1][1].data.display_name, 'Updated fixture');
});
test('missing session prevents account updates', async () => {
  const { users, calls } = fixture({ getUser: { data: { user: null }, error: { name: 'AuthSessionMissingError' } } });
  assert.equal(await users.getCurrentUser(), null);
  await assert.rejects(users.updateUser({ displayName: 'Updated' }), (error) => error.status === 401);
  assert.ok(calls.every((call) => call[0] === 'getUser'));
});
test('reset requests return a generic eligibility message', async () => {
  const { users, calls } = fixture();
  const result = await users.requestPasswordReset({ email: 'fixture@example.com' });
  assert.match(result.message, /If the account is eligible/);
  assert.equal(calls[0][0], 'resetPasswordForEmail');
});
test('confirmation and PKCE helpers verify their tokens through Supabase', async () => {
  const { users, calls } = fixture();
  await assert.rejects(users.confirmEmail({ tokenHash: 'fixture-token', type: 'admin' }), (error) => error.status === 400);
  await users.confirmEmail({ tokenHash: 'fixture-token', type: 'recovery' });
  await users.exchangeCode({ code: 'fixture-code' });
  assert.equal(calls[0][0], 'verifyOtp');
  assert.equal(calls[0][1].type, 'recovery');
  assert.equal(calls[1][0], 'exchangeCodeForSession');
});
test('rate-limit errors do not expose provider messages', async () => {
  const { users } = fixture({ signUp: { data: {}, error: { status: 429, message: 'sensitive provider details' } } });
  await assert.rejects(users.createUser({ email: 'fixture@example.com', password: 'ValidPassword123!' }), (error) => error.status === 429 && !error.message.includes('sensitive'));
});
