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
function profileStore() {
  let id;
  return { upsert: async value => { id = value.id; return { error: null }; }, select: () => ({ eq: () => ({ single: async () => ({ data: { id }, error: null }) }) }) };
}
const user = { id: 'fixture-user', email: 'fixture@example.com', user_metadata: { display_name: 'Fixture', role: 'admin' } };
function fixture(overrides = {}) {
  const calls = [];
  const auth = {};
  for (const name of ['signUp', 'signInWithPassword', 'signOut', 'getUser', 'resetPasswordForEmail', 'updateUser', 'verifyOtp', 'exchangeCodeForSession']) {
    auth[name] = async (...args) => { calls.push([name, ...args]); return overrides[name] ?? { data: { user, session: { access_token: 'secret-fixture-token' } }, error: null }; };
  }
  return { users: createUserFunctions({ auth, from: profileStore }), calls };
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

test('username account creation, session restoration, logout, and fresh account follow the guest pathway', async () => {
  let current = null;
  let created = 0;
  const calls = [];
  const users = createUserFunctions({ from: profileStore, auth: {
    getUser: async () => { calls.push('getUser'); return { data: { user: current }, error: current ? null : { name: 'AuthSessionMissingError' } }; },
    signInAnonymously: async (input) => {
      calls.push('signInAnonymously');
      assert.deepEqual(Object.keys(input.options.data).sort(), ['display_name', 'username']);
      current = { id: `guest-${++created}`, is_anonymous: true, user_metadata: input.options.data };
      return { data: { user: current, session: { access_token: 'private-token' } }, error: null };
    },
    signOut: async () => { calls.push('signOut'); current = null; return { error: null }; },
  } });
  const result = await users.signInWithUsername({ username: ' Demo User ' });
  assert.equal(result.user.displayName, 'Demo User');
  assert.equal(result.user.isGuest, true);
  assert.doesNotMatch(JSON.stringify(result), /private-token|access_token|password/);
  assert.equal((await users.getCurrentUser()).id, result.user.id);
  assert.equal((await users.signInWithUsername({ username: 'Another name' })).user.id, result.user.id);
  assert.equal(created, 1);
  await users.signOut();
  assert.equal(await users.getCurrentUser(), null);
  assert.notEqual((await users.signInWithUsername({ username: 'Demo User' })).user.id, result.user.id);
  assert.deepEqual(calls.slice(0, 2), ['getUser', 'signInAnonymously']);
});

test('invalid usernames never contact the authentication provider', async () => {
  const { users, calls } = fixture();
  for (const username of ['', 'a', '<script>', 'x'.repeat(41)]) {
    await assert.rejects(users.signInWithUsername({ username }), error => error.status === 400);
  }
  assert.equal(calls.length, 0);
});

test('disabled anonymous sign-in reports the actionable demo configuration error', async () => {
  const users = createUserFunctions({ from: profileStore, auth: {
    getUser: async () => ({ data: { user: null }, error: { name: 'AuthSessionMissingError' } }),
    signInAnonymously: async () => ({ data: {}, error: { code: 'anonymous_provider_disabled', status: 422 } }),
  } });
  await assert.rejects(users.signInWithUsername({ username: 'Demo User' }), error => error.code === 'GUEST_SIGNIN_DISABLED' && error.status === 503);
});
