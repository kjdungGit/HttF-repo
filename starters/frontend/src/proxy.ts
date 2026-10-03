import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  try {
    return await createClient(request);
  } catch {
    console.error("Supabase API session setup failed.");
    return NextResponse.json(
      { error: { code: "REQUEST_FAILED", message: "Unable to complete the request." } },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
