"use client";

import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import {
  emptySnapshot,
  sanitizeSnapshot,
  snapshotHasProgress,
  type Answers,
  type GuideSnapshot,
  type Id,
} from "@/utils/guide/progress";

const STORAGE_KEY = "keenfinance-guide-v1";

export type GuideSaveStatus = {
  signedIn: boolean;
  saving: boolean;
  error: boolean;
  code: "" | "load_failed" | "save_failed" | "saved";
};

function readLocal(): GuideSnapshot | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return sanitizeSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeLocal(snapshot: GuideSnapshot) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore quota */
  }
}

function applySnapshot(
  snapshot: GuideSnapshot,
  setActive: Dispatch<SetStateAction<Id>>,
  setOpenChild: Dispatch<SetStateAction<Partial<Record<Id, Id>>>>,
  setDone: Dispatch<SetStateAction<Set<Id>>>,
  setAnswers: Dispatch<SetStateAction<Answers>>,
) {
  setActive(snapshot.active);
  setOpenChild(snapshot.openChild);
  setDone(new Set(snapshot.done));
  setAnswers(snapshot.answers);
}

export function useGuidePersistence({
  snapshot,
  setActive,
  setOpenChild,
  setDone,
  setAnswers,
  setStatus,
}: {
  snapshot: GuideSnapshot;
  setActive: Dispatch<SetStateAction<Id>>;
  setOpenChild: Dispatch<SetStateAction<Partial<Record<Id, Id>>>>;
  setDone: Dispatch<SetStateAction<Set<Id>>>;
  setAnswers: Dispatch<SetStateAction<Answers>>;
  setStatus: Dispatch<SetStateAction<GuideSaveStatus>>;
}) {
  const userId = useRef<string | null>(null);
  const skipSave = useRef(true);
  const packed = JSON.stringify(snapshot);

  useEffect(() => {
    let cancelled = false;

    async function load(nextUser: string | null) {
      skipSave.current = true;
      userId.current = nextUser;
      if (!nextUser) {
        const local = readLocal();
        applySnapshot(local ?? emptySnapshot(), setActive, setOpenChild, setDone, setAnswers);
        setStatus({ signedIn: false, saving: false, error: false, code: "" });
        return;
      }
      setStatus({ signedIn: true, saving: true, error: false, code: "" });
      try {
        const response = await fetch("/api/guide", { credentials: "same-origin", cache: "no-store" });
        const data = await response.json();
        if (cancelled) return;
        if (response.status === 401) {
          userId.current = null;
          setStatus({ signedIn: false, saving: false, error: false, code: "" });
          return;
        }
        if (!response.ok) throw new Error(data.error?.message || "Could not load checklist.");
        const remote = sanitizeSnapshot(data.snapshot);
        const local = readLocal();
        if (snapshotHasProgress(remote)) {
          applySnapshot(remote, setActive, setOpenChild, setDone, setAnswers);
          writeLocal(remote);
        } else if (local && snapshotHasProgress(local)) {
          applySnapshot(local, setActive, setOpenChild, setDone, setAnswers);
          await fetch("/api/guide", {
            method: "PUT",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ snapshot: local }),
          });
        }
        setStatus({ signedIn: true, saving: false, error: false, code: "" });
      } catch {
        if (!cancelled) setStatus({ signedIn: true, saving: false, error: true, code: "load_failed" });
      }
    }

    function sessionChanged(event: Event) {
      const next = (event as CustomEvent<{ userId: string | null }>).detail?.userId;
      if (typeof next !== "string" && next !== null) return;
      if (next === null) {
        try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
        applySnapshot(emptySnapshot(), setActive, setOpenChild, setDone, setAnswers);
      }
      void load(next);
    }

    window.addEventListener("keenfinance:session-change", sessionChanged);
    void fetch("/api/auth/user", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        const data = await response.json();
        return typeof data.user?.id === "string" ? data.user.id : null;
      })
      .then((id) => { if (!cancelled) void load(id); })
      .catch(() => { if (!cancelled) void load(null); });

    return () => {
      cancelled = true;
      window.removeEventListener("keenfinance:session-change", sessionChanged);
    };
  }, [setActive, setAnswers, setDone, setOpenChild, setStatus]);

  useEffect(() => {
    const current = sanitizeSnapshot(JSON.parse(packed) as GuideSnapshot);
    writeLocal(current);
    if (!userId.current || skipSave.current) {
      skipSave.current = false;
      return;
    }
    const expected = userId.current;
    const timer = window.setTimeout(() => {
      setStatus((prev) => ({ ...prev, signedIn: true, saving: true, error: false, code: "" }));
      void fetch("/api/guide", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot: current }),
      }).then(async (response) => {
        if (expected !== userId.current) return;
        if (response.status === 401) {
          userId.current = null;
          setStatus({ signedIn: false, saving: false, error: false, code: "" });
          return;
        }
        if (!response.ok) {
          setStatus({ signedIn: true, saving: false, error: true, code: "save_failed" });
          return;
        }
        setStatus({ signedIn: true, saving: false, error: false, code: "saved" });
      }).catch(() => {
        if (expected === userId.current) {
          setStatus({ signedIn: true, saving: false, error: true, code: "save_failed" });
        }
      });
    }, 450);
    return () => window.clearTimeout(timer);
  }, [packed, setStatus]);
}
