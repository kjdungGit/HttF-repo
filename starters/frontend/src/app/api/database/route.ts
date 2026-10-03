import { NextResponse } from "next/server";
import { registeredTables } from "@/utils/supabase/tables";

export function GET() {
  return NextResponse.json(
    { tables: Object.keys(registeredTables), schemaConfigured: Object.keys(registeredTables).length > 0 },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
