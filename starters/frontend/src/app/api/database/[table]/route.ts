import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createTableFunctions, getTableDefinition, TableRequestError } from "@/utils/supabase/tables";

type Context = { params: Promise<{ table: string }> };
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: Request, context: Context) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const { table } = await context.params;
    getTableDefinition(table);
    const supabase = createClient(await cookies());
    if (request.method !== "GET") {
      const origin = request.headers.get("origin");
      if (origin && origin !== new URL(request.url).origin) {
        throw new TableRequestError("INVALID_ORIGIN", 403, "Same-origin request required.");
      }
      const { data, error } = await supabase.auth.getClaims();
      if (error || !data?.claims?.sub) {
        throw new TableRequestError("AUTH_REQUIRED", 401, "A verified session is required for writes.");
      }
    }
    const functions = createTableFunctions(supabase)[table];
    let rows: unknown;
    if (request.method === "GET") {
      const url = new URL(request.url);
      const limit = url.searchParams.has("limit") ? Number(url.searchParams.get("limit")) : 100;
      const columns = url.searchParams.get("columns")?.split(",");
      rows = await functions.read({ limit, columns });
    } else {
      let body;
      try { body = await request.json(); } catch {
        throw new TableRequestError("INVALID_INPUT", 400, "Expected valid JSON.");
      }
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw new TableRequestError("INVALID_INPUT", 400, "Expected a JSON object.");
      }
      if (request.method === "POST") rows = await functions.insert(body.values);
      else if (request.method === "PATCH") rows = await functions.update(body.key, body.values);
      else rows = await functions.delete(body.key);
    }
    return NextResponse.json({ table, data: rows ?? [] }, { status: request.method === "POST" ? 201 : 200, headers });
  } catch (error) {
    const known = error instanceof TableRequestError;
    return NextResponse.json(
      { error: { code: known ? error.code : "REQUEST_FAILED", message: known ? error.message : "Unable to complete the request." } },
      { status: known ? error.status : 500, headers },
    );
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
