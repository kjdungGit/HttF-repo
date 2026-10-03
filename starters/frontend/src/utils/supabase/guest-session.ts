import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { cookies } from "next/headers";

import { getSupabaseConfig } from "./config";

export const GUEST_COOKIE = "kf-guest";

export type GuestUser = {
  id: string;
  email?: string;
  emailConfirmed: boolean;
  isGuest: true;
  displayName: string | null;
};

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function secret() {
  return getSupabaseConfig().key;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function encode(user: GuestUser) {
  const payload = Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(value: string): GuestUser | null {
  const separator = value.lastIndexOf(".");
  if (separator <= 0) return null;
  const payload = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<GuestUser>;
    if (typeof parsed.id !== "string" || !parsed.id) return null;
    return {
      id: parsed.id,
      email: parsed.email,
      emailConfirmed: false,
      isGuest: true,
      displayName: typeof parsed.displayName === "string" ? parsed.displayName : null,
    };
  } catch {
    return null;
  }
}

export function readGuestUser(store: CookieStore): GuestUser | null {
  const raw = store.get(GUEST_COOKIE)?.value;
  if (!raw) return null;
  return decode(raw);
}

export function writeGuestUser(store: CookieStore, username: string): { user: GuestUser } {
  const existing = readGuestUser(store);
  if (existing) return { user: existing };
  const user: GuestUser = {
    id: randomUUID(),
    emailConfirmed: false,
    isGuest: true,
    displayName: username,
  };
  store.set(GUEST_COOKIE, encode(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  return { user };
}

export function clearGuestUser(store: CookieStore) {
  store.delete(GUEST_COOKIE);
}
