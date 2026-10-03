"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { useTranslation } from "react-i18next";

type User = {
  id: string;
  email?: string;
  displayName: string | null;
  isGuest?: boolean;
};
type Mode = "signin" | "account" | null;

function UserPicture({
  signedIn,
  large = false,
}: {
  signedIn: boolean;
  large?: boolean;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ${large ? "h-14 w-14" : "h-9 w-9"} ${signedIn ? "bg-gradient-to-br from-uiuc to-navy text-white" : "bg-slate-100 text-slate-500"}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={large ? "h-8 w-8" : "h-5 w-5"}
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <circle cx="12" cy="8" r="3.5" />
        <path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function message(code?: string) {
  return code === "GUEST_SIGNIN_DISABLED"
    ? "signinUnavailable"
    : code === "RATE_LIMITED"
      ? "rateLimited"
      : code === "INVALID_INPUT"
        ? "invalidUsername"
        : "requestFailed";
}

export default function UserMenu() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`account.${key}`);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sessionVersion = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const errorId = useId();
  const displayName =
    user?.displayName?.trim() || user?.email?.split("@")[0] || tr("title");

  useEffect(() => {
    const controller = new AbortController();
    const version = sessionVersion.current;
    fetch("/api/auth/user", {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401) return null;
        if (!response.ok) throw new Error("Session check failed");
        const data = await response.json();
        return data.user as User;
      })
      .then((currentUser) => {
        if (controller.signal.aborted || version !== sessionVersion.current)
          return;
        setUser(currentUser);
        setLoading(false);
        window.dispatchEvent(
          new CustomEvent("keenfinance:session-change", {
            detail: { userId: currentUser?.id ?? null },
          }),
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setError("unavailable");
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (mode) {
      if (!element.open) element.showModal();
      element.querySelector<HTMLInputElement>("input")?.focus();
    } else if (element.open) {
      element.close();
      trigger.current?.focus();
    }
  }, [mode]);

  function open(next: Mode) {
    setError("");
    setMode(next);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    const username = String(values.get("username") || "").trim();
    if (!username) {
      setError("missingUsername");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/guest", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(message(data.error?.code));
        return;
      }
      if (!data.user?.id) throw new Error("Missing user");
      sessionVersion.current += 1;
      setUser(data.user);
      window.dispatchEvent(
        new CustomEvent("keenfinance:session-change", {
          detail: { userId: data.user.id },
        }),
      );
      setMode(null);
    } catch {
      setError("unavailable");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("Sign out failed");
      sessionVersion.current += 1;
      setUser(null);
      window.dispatchEvent(
        new CustomEvent("keenfinance:session-change", {
          detail: { userId: null },
        }),
      );
      setMode(null);
    } catch {
      setError("signoutFailed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        disabled={loading}
        onClick={() => open(user ? "account" : "signin")}
        aria-label={
          loading
            ? tr("checking")
            : user
              ? t("account.open", { name: displayName })
              : tr("signin")
        }
        className="flex items-center gap-2 rounded-full p-1 pr-3 text-sm font-semibold transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-uiuc disabled:opacity-60"
      >
        <UserPicture signedIn={Boolean(user)} />
        <span className="max-w-32 truncate">
          {loading ? tr("label") : user ? displayName : tr("signin")}
        </span>
      </button>

      <dialog
        ref={dialog}
        aria-labelledby={headingId}
        onCancel={(event) => {
          if (busy) event.preventDefault();
          else setMode(null);
        }}
        onClose={() => {
          setMode(null);
          trigger.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget && !busy) setMode(null);
        }}
        className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-black/10 bg-white p-0 text-ink shadow-2xl backdrop:bg-navy/60"
      >
        <div className="p-7 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-orange">
                KEENFinance
              </p>
              <h2 id={headingId} className="text-2xl font-bold">
                {mode === "account" ? tr("title") : tr("choose")}
              </h2>
            </div>
            <button
              type="button"
              aria-label={tr("close")}
              disabled={busy}
              onClick={() => setMode(null)}
              className="rounded-full px-2 py-1 text-xl text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            >
              ×
            </button>
          </div>

          {error && (
            <p
              id={errorId}
              role="alert"
              className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
              {tr(error)}
            </p>
          )}

          {mode === "account" ? (
            <div>
              <div className="mb-7 flex items-center gap-3">
                <UserPicture signedIn large />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{displayName}</p>
                  <p className="break-all text-sm text-slate-500">
                    {user?.isGuest ? tr("guest") : user?.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={signOut}
                className="w-full rounded-lg bg-navy px-4 py-3 font-semibold text-white hover:bg-uiuc disabled:opacity-60"
              >
                {busy ? tr("signingOut") : tr("signout")}
              </button>
            </div>
          ) : (
            <form
              key={mode}
              onSubmit={submit}
              aria-describedby={error ? errorId : undefined}
            >
              <fieldset disabled={busy} className="space-y-4">
                <p className="text-sm leading-6 text-slate-600">
                  {tr("instructions")}
                </p>
                <label className="block text-sm font-medium">
                  {tr("username")}
                  <input
                    name="username"
                    required
                    minLength={2}
                    maxLength={40}
                    autoComplete="nickname"
                    className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-uiuc focus:ring-2 focus:ring-uiuc/20"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-navy px-4 py-3 font-semibold text-white transition hover:bg-uiuc disabled:opacity-60"
                >
                  {busy ? tr("starting") : tr("continue")}
                </button>
                <p className="text-xs leading-5 text-slate-500">
                  {tr("sessionNote")}
                </p>
              </fieldset>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
