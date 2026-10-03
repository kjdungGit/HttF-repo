import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createTableFunctions, TableRequestError } from "@/utils/supabase/tables";
import {
  MAIN,
  checklistTitle,
  emptySnapshot,
  sanitizeSnapshot,
  stepStatus,
  whyNeeded,
  type GuideSnapshot,
} from "@/utils/guide/progress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class GuideError extends Error {
  constructor(public code: string, public status: number, message: string) {
    super(message);
  }
}

async function session(request: Request) {
  const origin = request.headers.get("origin");
  if (request.method !== "GET" && origin && origin !== new URL(request.url).origin) {
    throw new GuideError("INVALID_ORIGIN", 403, "Same-origin request required.");
  }
  const client = createClient(await cookies());
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new GuideError("AUTH_REQUIRED", 401, "Sign in to save your checklist.");
  return { client, user: data.user };
}

function fail(error: unknown) {
  const known = error instanceof GuideError || error instanceof TableRequestError;
  return NextResponse.json(
    { error: { code: known ? error.code : "REQUEST_FAILED", message: known ? error.message : "Unable to complete the request." } },
    { status: known ? error.status : 500, headers: { "Cache-Control": "private, no-store" } },
  );
}

type ChecklistRow = { id?: string; title?: string; status?: string; user_id?: string };

async function syncChecklist(
  db: ReturnType<typeof createTableFunctions>,
  userId: string,
  snapshot: GuideSnapshot,
) {
  const rows = ((await db.checklist_items.read({ limit: 100 })) as ChecklistRow[]) ?? [];
  const mine = rows.filter((row) => row.user_id === userId || row.title?.startsWith("guide:"));
  for (const step of MAIN) {
    const title = checklistTitle(step.id);
    const values = {
      title,
      status: stepStatus(step.id, snapshot),
      why_needed: whyNeeded(step.id),
      user_id: userId,
    };
    const existing = mine.find((row) => row.title === title);
    if (existing?.id) {
      await db.checklist_items.update({ id: existing.id }, { status: values.status, why_needed: values.why_needed });
    } else {
      try {
        await db.checklist_items.insert(values);
      } catch {
        const { user_id: _userId, ...rest } = values;
        await db.checklist_items.insert(rest);
      }
    }
  }
}

async function saveProfile(
  db: ReturnType<typeof createTableFunctions>,
  userId: string,
  snapshot: GuideSnapshot,
) {
  const payload = {
    household_info: { guide: snapshot },
    preferred_language: snapshot.language,
    tax_year: 2025,
    state: "IL",
  };
  try {
    await db.profiles.update({ id: userId }, payload);
  } catch {
    try {
      await db.profiles.update({ id: userId }, { household_info: { guide: snapshot } });
    } catch {
      await db.profiles.insert({ id: userId, household_info: { guide: snapshot } });
    }
  }
}

export async function GET(request: Request) {
  try {
    const { client, user } = await session(request);
    const db = createTableFunctions(client);
    const profiles = ((await db.profiles.read({ where: { id: user.id }, limit: 1 })) as { household_info?: unknown; preferred_language?: string }[]) ?? [];
    const stored = profiles[0]?.household_info;
    const guide = stored && typeof stored === "object" && stored !== null && "guide" in stored
      ? (stored as { guide: unknown }).guide
      : stored;
    const language = profiles[0]?.preferred_language === "es" ? "es" : "en";
    const snapshot = sanitizeSnapshot(guide, language);
    return NextResponse.json({ userId: user.id, snapshot }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  try {
    const { client, user } = await session(request);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new GuideError("INVALID_INPUT", 400, "Expected valid JSON.");
    }
    const snapshot = sanitizeSnapshot(body && typeof body === "object" && body !== null && "snapshot" in body
      ? (body as { snapshot: unknown }).snapshot
      : body);
    const db = createTableFunctions(client);
    await saveProfile(db, user.id, snapshot);
    try {
      await syncChecklist(db, user.id, snapshot);
    } catch {
      // Profile save is enough if checklist columns/constraints differ.
    }
    return NextResponse.json({ userId: user.id, snapshot }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return fail(error);
  }
}
