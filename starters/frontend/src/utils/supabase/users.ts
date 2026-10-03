import type { SupabaseClient, User } from "@supabase/supabase-js";

export class UserRequestError extends Error {
  constructor(public code: string, public status: number, message: string) { super(message); }
}

export function requireObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new UserRequestError("INVALID_INPUT", 400, "Expected a JSON object.");
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, name: string, max: number) {
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new UserRequestError("INVALID_INPUT", 400, `Provide a valid ${name}.`);
  }
  return value;
}

function email(value: unknown) {
  const address = text(value, "email address", 254).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    throw new UserRequestError("INVALID_INPUT", 400, "Provide a valid email address.");
  }
  return address;
}

function password(value: unknown, creating = false) {
  const result = text(value, "password", 128);
  if (creating && result.length < 8) {
    throw new UserRequestError("INVALID_INPUT", 400, "New passwords require at least 8 characters.");
  }
  return result;
}

function authError(error: { code?: string; status?: number } | null) {
  if (!error) return;
  if (error.code === "anonymous_provider_disabled") {
    throw new UserRequestError("GUEST_SIGNIN_DISABLED", 503, "Username sign-in is not enabled yet.");
  }
  const limited = error.status === 429;
  const badCredentials = ["invalid_credentials", "email_not_confirmed", "session_not_found", "refresh_token_not_found"].includes(error.code ?? "");
  throw new UserRequestError(limited ? "RATE_LIMITED" : badCredentials ? "AUTH_FAILED" : "AUTH_REQUEST_FAILED",
    limited ? 429 : badCredentials ? 401 : error.status && error.status < 500 ? 400 : 503,
    limited ? "Please try again later." : "Unable to complete the authentication request.");
}

function publicUser(user: User | null) {
  if (!user) return null;
  return { id: user.id, email: user.email, emailConfirmed: Boolean(user.email_confirmed_at), isGuest: Boolean(user.is_anonymous),
    displayName: typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : null };
}

/** Request-scoped Node helpers. Sessions remain in SSR cookies, never response bodies. */
export function createUserFunctions(client: SupabaseClient) {
  async function ensureProfile(id: string) {
    const { error } = await client.from("profiles").upsert({ id }, { onConflict: "id", ignoreDuplicates: true });
    if (error) throw new UserRequestError("PROFILE_UNAVAILABLE", 503, "Your session exists, but your database profile could not be saved. Check profiles permissions.");
    const { data, error: readError } = await client.from("profiles").select("id").eq("id", id).single();
    if (readError || !data) throw new UserRequestError("PROFILE_UNAVAILABLE", 503, "Unable to verify your database profile.");
  }
  async function getCurrentUser() {
    const { data, error } = await client.auth.getUser();
    if (error?.name === "AuthSessionMissingError") return null;
    authError(error);
    return publicUser(data.user);
  }

  return {
    async signInWithUsername(input: Record<string, unknown>) {
      requireObject(input);
      const username = text(input.username, "username", 40).trim();
      if (!/^[\p{L}\p{N}][\p{L}\p{N}_. -]{1,39}$/u.test(username)) {
        throw new UserRequestError("INVALID_INPUT", 400, "Use 2–40 letters, numbers, spaces, dots, underscores, or hyphens.");
      }
      // A username labels a guest; it never authenticates an existing account.
      const existingUser = await getCurrentUser();
      if (existingUser) { await ensureProfile(existingUser.id); return { user: existingUser }; }
      const { data, error } = await client.auth.signInAnonymously({ options: { data: { username, display_name: username } } });
      authError(error);
      if (!data.user || !data.session) throw new UserRequestError("AUTH_REQUEST_FAILED", 503, "Unable to start a guest session.");
      if (data.user) await ensureProfile(data.user.id);
      return { user: publicUser(data.user) };
    },
    async createUser(input: Record<string, unknown>) {
      requireObject(input);
      const metadata = input.displayName === undefined ? {} : { display_name: text(input.displayName, "display name", 100).trim() };
      const { data, error } = await client.auth.signUp({ email: email(input.email), password: password(input.password, true), options: { data: metadata } });
      authError(error);
      if (data.session && data.user) await ensureProfile(data.user.id);
      return { user: publicUser(data.user), confirmationRequired: !data.session };
    },
    async signIn(input: Record<string, unknown>) {
      requireObject(input);
      const { data, error } = await client.auth.signInWithPassword({ email: email(input.email), password: password(input.password) });
      authError(error);
      if (data.user) await ensureProfile(data.user.id);
      return { user: publicUser(data.user) };
    },
    async signOut() {
      const { error } = await client.auth.signOut({ scope: "local" });
      authError(error);
      return { signedOut: true };
    },
    getCurrentUser,
    async requestPasswordReset(input: Record<string, unknown>) {
      requireObject(input);
      const { error } = await client.auth.resetPasswordForEmail(email(input.email));
      authError(error);
      return { message: "If the account is eligible, password reset instructions will be sent." };
    },
    async updateUser(input: Record<string, unknown>) {
      requireObject(input);
      const allowed = ["email", "password", "displayName"];
      if (!Object.keys(input).length || Object.keys(input).some((key) => !allowed.includes(key))) {
        throw new UserRequestError("INVALID_INPUT", 400, "Provide email, password, or displayName updates.");
      }
      const changes = {
        ...(input.email === undefined ? {} : { email: email(input.email) }),
        ...(input.password === undefined ? {} : { password: password(input.password, true) }),
        ...(input.displayName === undefined ? {} : { data: { display_name: text(input.displayName, "display name", 100).trim() } }),
      };
      if (!await getCurrentUser()) throw new UserRequestError("AUTH_REQUIRED", 401, "Sign in before updating your account.");
      const { data, error } = await client.auth.updateUser(changes);
      authError(error);
      if (data.user) await ensureProfile(data.user.id);
      return { user: publicUser(data.user) };
    },
    async confirmEmail(input: Record<string, unknown>) {
      requireObject(input);
      const token_hash = text(input.tokenHash, "confirmation token", 2048);
      const type = input.type;
      if (type !== "email" && type !== "signup" && type !== "recovery" && type !== "email_change") {
        throw new UserRequestError("INVALID_INPUT", 400, "Unsupported email confirmation type.");
      }
      const { data, error } = await client.auth.verifyOtp({ token_hash, type });
      authError(error);
      if (data.user) await ensureProfile(data.user.id);
      return { user: publicUser(data.user) };
    },
    async exchangeCode(input: Record<string, unknown>) {
      requireObject(input);
      const { data, error } = await client.auth.exchangeCodeForSession(text(input.code, "authorization code", 2048));
      authError(error);
      if (data.user) await ensureProfile(data.user.id);
      return { user: publicUser(data.user) };
    },
  };
}
