import templateData from "./tax-templates.json" with { type: "json" };

export const templates = templateData.templates;
export const MAX_PDF_BYTES = 8 * 1024 * 1024;
export class DocumentError extends Error {
  constructor(code, status, message) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function decimalValue(value) {
  if (typeof value !== "string") return null;
  let text = value.trim().replace(/^\$/, "").trim();
  if (!text) return null;
  if (/^\([\d,.]+\)$/.test(text)) text = "-" + text.slice(1, -1);
  // US tax-form numeric format, independent of interface language. Ambiguous locale
  // separators are rejected rather than silently changing an amount.
  if (!/^-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?$/.test(text)) return null;
  text = text.replaceAll(",", "");
  const [whole, fraction = ""] = text.split(".");
  if (whole.replace("-", "").length > 12) return null;
  return `${whole}.${fraction.padEnd(2, "0")}`;
}

export function identifyTemplate(pages) {
  const candidates = templates.filter(
    (template) =>
      template.pages.length === pages.length &&
      template.pages.every((page, index) => {
        const actual = pages[index];
        if (
          Math.abs(page.width - actual.width) > 0.02 ||
          Math.abs(page.height - actual.height) > 0.02
        )
          return false;
        const expected = template.fields.filter(
          (field) => field.page === index + 1,
        );
        return (
          expected.length === actual.widgets.length &&
          expected.every((field) =>
            actual.widgets.some(
              (widget) =>
                widget.fieldName === field.name &&
                field.rect.every(
                  (coordinate, i) =>
                    Math.abs(coordinate - widget.topRect[i]) <= 0.02,
                ),
            ),
          )
        );
      }),
  );
  if (candidates.length !== 1)
    throw new DocumentError(
      "UNSUPPORTED_TEMPLATE",
      422,
      "This PDF layout is not a verified template. Scans and flattened PDFs need OCR or manual entry.",
    );
  return candidates[0];
}

export async function extractTaxPdf(buffer, engine) {
  if (!buffer.length || buffer.length > MAX_PDF_BYTES)
    throw new DocumentError(
      "FILE_TOO_LARGE",
      413,
      "Use a PDF no larger than 8 MB.",
    );
  if (!new TextDecoder().decode(buffer.subarray(0, 1024)).includes("%PDF-"))
    throw new DocumentError("INVALID_PDF", 400, "Choose a valid PDF file.");
  const sourceHash = Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
  const pdfjs = engine ?? (await import("pdfjs-dist/build/pdf.mjs"));
  if (!engine)
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
  const task = pdfjs.getDocument({
    verbosity: 0,
    data: new Uint8Array(buffer),
    ...(engine
      ? {}
      : {
          standardFontDataUrl: "/pdfjs/standard_fonts/",
          wasmUrl: "/pdfjs/wasm/",
        }),
  });
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new DocumentError(
            "PDF_TIMEOUT",
            422,
            "PDF processing took too long.",
          ),
        ),
      20000,
    );
  });
  try {
    return await Promise.race([
      timeout,
      (async () => {
        const pdf = await task.promise;
        if (pdf.numPages > 16)
          throw new DocumentError(
            "TOO_MANY_PAGES",
            422,
            "Upload one tax form at a time, with no more than 16 pages.",
          );
        const pages = [];
        for (let number = 1; number <= pdf.numPages; number++) {
          const page = await pdf.getPage(number);
          const viewport = page.getViewport({ scale: 1, rotation: 0 });
          const widgets = (await page.getAnnotations())
            .filter((a) => a.subtype === "Widget" && !a.pushButton)
            .map((a) => {
              const p1 = viewport.convertToViewportPoint(a.rect[0], a.rect[1]);
              const p2 = viewport.convertToViewportPoint(a.rect[2], a.rect[3]);
              return {
                ...a,
                topRect: [
                  Math.min(p1[0], p2[0]),
                  Math.min(p1[1], p2[1]),
                  Math.max(p1[0], p2[0]),
                  Math.max(p1[1], p2[1]),
                ],
              };
            });
          pages.push({
            width: viewport.width,
            height: viewport.height,
            widgets,
            page,
            viewport,
          });
        }
        const template = identifyTemplate(pages);
        const mappings = template.fields.filter((field) => field.key);
        if (!mappings.length)
          throw new DocumentError(
            "NO_REVIEWED_MAPPING",
            422,
            "This form has verified boxes but no supported numeric key mapping yet.",
          );
        const fields = {},
          evidence = {};
        for (const mapping of mappings) {
          const page = pages[mapping.page - 1];
          const widget = page.widgets.find(
            (w) =>
              w.fieldName === mapping.name &&
              w.topRect.every((v, i) => Math.abs(v - mapping.rect[i]) <= 0.02),
          );
          let raw =
            typeof widget.fieldValue === "string"
              ? widget.fieldValue.trim()
              : "";
          let method = "pdf_widget";
          if (!raw) {
            // Text fallback is restricted to this verified field's interior.
            page.text ??= await page.page.getTextContent();
            const pieces = page.text.items
              .filter((item) => typeof item.str === "string" && item.str.trim())
              .filter((item) => {
                const [x, y] = page.viewport.convertToViewportPoint(
                  item.transform[4],
                  item.transform[5],
                );
                const cx = x + item.width / 2,
                  cy = y - item.height / 2;
                return (
                  cx > mapping.rect[0] &&
                  cx < mapping.rect[2] &&
                  cy > mapping.rect[1] &&
                  cy < mapping.rect[3]
                );
              });
            raw = pieces
              .map((item) => item.str)
              .join(" ")
              .trim();
            method = "bounded_text";
          }
          fields[mapping.key] = decimalValue(raw);
          evidence[mapping.key] = {
            page: mapping.page,
            line: mapping.line,
            fieldName: mapping.name,
            rect: mapping.rect,
            method,
            status: raw
              ? fields[mapping.key] === null
                ? "needs_review"
                : "extracted"
              : "missing",
          };
        }
        return {
          recordId: crypto.randomUUID(),
          templateId: template.id,
          formType: template.formType,
          language: template.language,
          taxYear: template.taxYear,
          sourceHash,
          fields,
          evidence,
          warnings: [
            "Review values before saving. Empty fields remain unknown; no calculations are inferred.",
            `${template.fields.length - mappings.length} fields have no numeric mapping and were omitted.`,
          ],
        };
      })(),
    ]);
  } catch (error) {
    if (error instanceof DocumentError) throw error;
    throw new DocumentError(
      "PDF_UNREADABLE",
      422,
      "Could not read this PDF. Password-protected or damaged files are unsupported.",
    );
  } finally {
    clearTimeout(timer);
    await task.destroy();
  }
}

export function confirmedRecord(input) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    input.confirmed !== true
  )
    throw new DocumentError(
      "REVIEW_REQUIRED",
      400,
      "Review and confirm the extracted values first.",
    );
  const template = templates.find(
    (template) => template.id === input.templateId,
  );
  if (!template || !template.taxYear)
    throw new DocumentError(
      "UNSUPPORTED_TEMPLATE",
      422,
      "Choose a supported tax form.",
    );
  if (
    !input.fields ||
    typeof input.fields !== "object" ||
    Array.isArray(input.fields)
  )
    throw new DocumentError("INVALID_FIELDS", 400, "Provide mapped fields.");
  const allowed = new Set(
    template.fields.filter((field) => field.key).map((field) => field.key),
  );
  const fields = {};
  for (const [key, value] of Object.entries(input.fields)) {
    if (!allowed.has(key))
      throw new DocumentError(
        "INVALID_FIELDS",
        400,
        "Only mapped numeric tax fields can be saved.",
      );
    if (value === null || value === "") continue;
    const decimal = decimalValue(value);
    if (decimal === null)
      throw new DocumentError(
        "INVALID_FIELDS",
        400,
        "Enter numbers using a decimal point and optional thousands commas.",
      );
    fields[key] = decimal;
  }
  if (!Object.keys(fields).length)
    throw new DocumentError(
      "EMPTY_FIELDS",
      400,
      "Enter at least one confirmed value.",
    );
  if (
    typeof input.recordId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      input.recordId,
    )
  )
    throw new DocumentError(
      "INVALID_FIELDS",
      400,
      "Provide a valid review record id.",
    );
  return {
    record: {
      id: input.recordId,
      tax_year: template.taxYear,
      status: "reviewed",
      form_type: template.formType,
      language: template.language,
      template_id: template.id,
      fields,
    },
  };
}
