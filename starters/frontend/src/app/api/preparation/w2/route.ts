import { preparationBody } from "@/utils/preparation/request";
import { documentSession, documentError } from "@/utils/pdf/document-request";
import { DocumentError } from "@/utils/pdf/tax-extraction.mjs";
import { validatePreparation } from "@/utils/preparation/model.mjs";
export const runtime = "nodejs";
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
        "Check the reviewed values.",
      );
    }
    if (
      !preparation.w2.confirmed ||
      !preparation.w2.recordId ||
      !Object.values(preparation.w2.fields).some((value) => value !== null)
    )
      throw new DocumentError(
        "REVIEW_REQUIRED",
        400,
        "Confirm at least one W-2 value before recording.",
      );
    const fields = Object.fromEntries(
      Object.entries(preparation.w2.fields).filter(
        ([, value]) => value !== null,
      ),
    );
    const { error } = await client.rpc("append_profile_tax_form", {
      target_column: "form_w2",
      form_record: {
        id: preparation.w2.recordId,
        tax_year: 2025,
        status: "reviewed",
        form_type: "w2",
        language:
          request.headers.get("x-preparation-language") === "es" ? "es" : "en",
        issuer: preparation.w2.employer,
        fields,
        source: preparation.w2.source,
      },
    });
    if (error)
      throw new DocumentError(
        "SAVE_UNAVAILABLE",
        503,
        "Could not record online. Your review is still here; download a backup and try again.",
      );
    return Response.json(
      { saved: true, recordId: preparation.w2.recordId, userId: user.id },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return documentError(error);
  }
}
