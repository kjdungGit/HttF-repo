import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { listTodos } from "@/utils/supabase/todos";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "private, no-store" };

  try {
    const supabase = createClient(await cookies());
    const { data, error } = await listTodos(supabase);

    if (error) {
      console.error("Supabase todos request failed:", error.code || "request_failed");
      return NextResponse.json(
        { error: { code: "TODOS_UNAVAILABLE", message: "Unable to retrieve todos." } },
        { status: 503, headers },
      );
    }

    return NextResponse.json({ todos: data ?? [] }, { headers });
  } catch {
    console.error("Supabase todos request could not be completed.");
    return NextResponse.json(
      { error: { code: "REQUEST_FAILED", message: "Unable to complete the request." } },
      { status: 500, headers },
    );
  }
}
