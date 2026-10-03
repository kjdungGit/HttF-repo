import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isSameOrigin } from "@/utils/supabase/origin";
import { createUserFunctions, requireObject, UserRequestError } from "@/utils/supabase/users";

type Context = { params: Promise<{ action: string }> };
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const postActions = ["guest", "signup", "login", "logout", "reset-password", "confirm", "exchange-code"];

async function handle(request: Request, context: Context) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const { action } = await context.params;
    if (action !== "user" && !postActions.includes(action)) throw new UserRequestError("UNKNOWN_ACTION", 404, "Unknown auth action.");
    if ((action === "user" && !["GET", "PATCH"].includes(request.method)) ||
        (action !== "user" && request.method !== "POST")) {
      throw new UserRequestError("METHOD_NOT_ALLOWED", 405, "Method not allowed for this action.");
    }
    let body: Record<string, unknown> = {};
    if (request.method !== "GET") {
      if (!isSameOrigin(request)) throw new UserRequestError("INVALID_ORIGIN", 403, "Same-origin request required.");
      if (action !== "logout") {
        try { body = requireObject(await request.json()); } catch (error) {
          if (error instanceof UserRequestError) throw error;
          throw new UserRequestError("INVALID_INPUT", 400, "Expected valid JSON.");
        }
      }
    }
    const jar = await cookies();
    const users = createUserFunctions(createClient(jar));
    let result;
    if (action === "user") {
      if (request.method === "PATCH") result = await users.updateUser(body);
      else {
        const user = await users.getCurrentUser();
        if (!user) throw new UserRequestError("AUTH_REQUIRED", 401, "No authenticated user.");
        result = { user };
      }
    } else if (action === "guest") {
      result = await users.signInWithUsername(body);
      jar.delete("kf-guest");
    } else if (action === "signup") result = await users.createUser(body);
    else if (action === "login") result = await users.signIn(body);
    else if (action === "logout") {
      jar.delete("kf-guest");
      result = await users.signOut();
    }
    else if (action === "reset-password") result = await users.requestPasswordReset(body);
    else if (action === "confirm") result = await users.confirmEmail(body);
    else result = await users.exchangeCode(body);
    return NextResponse.json(result, { status: action === "signup" ? 201 : 200, headers });
  } catch (error) {
    const known = error instanceof UserRequestError;
    return NextResponse.json({ error: { code: known ? error.code : "REQUEST_FAILED", message: known ? error.message : "Unable to complete the request." } },
      { status: known ? error.status : 500, headers });
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
