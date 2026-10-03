import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  try {
    return await createClient(request);
  } catch (error) {
    const missing = error instanceof Error && /Supabase|\.env\.local/i.test(error.message);
    return NextResponse.json(
      {
        error: {
          code: missing ? "CONFIG_MISSING" : "REQUEST_FAILED",
          message: missing
            ? "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local."
            : "Unable to complete the request.",
        },
      },
      { status: missing ? 503 : 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
