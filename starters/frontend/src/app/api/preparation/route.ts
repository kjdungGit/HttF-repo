import { preparationBody } from "@/utils/preparation/request";
import { documentSession, documentError } from "@/utils/pdf/document-request";
import { DocumentError } from "@/utils/pdf/tax-extraction.mjs";
import { validatePreparation } from "@/utils/preparation/model.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const { client, user } = await documentSession(request);
    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (error)
      throw new DocumentError(
        "PROGRESS_UNAVAILABLE",
        503,
        "Could not load saved progress. Your browser backup can still be used.",
      );
    let preparation = null;
    if (data?.preparation_progress?.version === 1)
      preparation = validatePreparation(data.preparation_progress);
    return Response.json(
      { userId: user.id, preparation },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return documentError(error);
  }
}
export async function POST(request: Request) {
  try {
    const { client, user } = await documentSession(request);
    const body = await preparationBody(request);
    let preparation;
    try {
      preparation = validatePreparation(JSON.parse(body));
    } catch {
      throw new DocumentError(
        "INVALID_PROGRESS",
        400,
        "Check the preparation values before saving.",
      );
    }
    const { data, error } = await client
      .from("profiles")
      .update({ preparation_progress: preparation })
      .eq("id", user.id)
      .select("id")
      .maybeSingle();
    if (error || !data)
      throw new DocumentError(
        "PROGRESS_UNAVAILABLE",
        503,
        "Could not save online. Keep your browser copy or download a backup.",
      );
    return Response.json(
      { saved: true, userId: user.id },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return documentError(error);
  }
}
