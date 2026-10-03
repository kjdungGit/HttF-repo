import { DocumentError } from "@/utils/pdf/tax-extraction.mjs";
// Bound JSON before buffering, including requests without Content-Length.
export async function preparationBody(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new DocumentError(
      "INVALID_PROGRESS",
      400,
      "Expected JSON preparation data.",
    );
  const reader = request.body?.getReader();
  if (!reader)
    throw new DocumentError(
      "INVALID_PROGRESS",
      400,
      "Missing preparation data.",
    );
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > 32768) {
      await reader.cancel();
      throw new DocumentError(
        "INVALID_PROGRESS",
        413,
        "Preparation data is too large.",
      );
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
