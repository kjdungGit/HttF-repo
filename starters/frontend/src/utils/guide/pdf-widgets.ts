import { emptyValues, formStatus, matchGuideForm, type FormId, type GuideForm } from "./forms";

export const WIDGET_TO_FIELD: Record<FormId, Record<string, string>> = {
  w2: {
    employee: "employeeName",
    employer: "employerName",
    ein: "ein",
    box1: "wages",
    box2: "federalWithheld",
    box3: "ssWages",
    box16: "stateWages",
  },
  nec: {
    payer: "payerName",
    recipient: "recipientName",
    box1: "compensation",
    box4: "federalWithheld",
    box7: "stateIncome",
  },
  int: {
    payer: "payerName",
    recipient: "recipientName",
    box1: "interest",
    box4: "federalWithheld",
  },
  e: {},
  t: {},
  g: {},
  a: {},
  prior: {
    name: "filingName",
    year: "taxYear",
    line1a: "wagesNoted",
    line2b: "taxableInterest",
  },
};

export async function readPdfWidgets(file: File) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
  const data = new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({ data });
  try {
    const pdf = await task.promise;
    const widgets: Record<string, string> = {};
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number);
      const annotations = await page.getAnnotations();
      for (const annotation of annotations) {
        if (annotation.subtype !== "Widget" || typeof annotation.fieldName !== "string") continue;
        const value = annotation.fieldValue;
        widgets[annotation.fieldName] = typeof value === "string" ? value.trim() : Array.isArray(value) ? value.join(" ").trim() : "";
      }
    }
    return widgets;
  } finally {
    await task.destroy();
  }
}

export function valuesFromWidgets(form: GuideForm, widgets: Record<string, string>) {
  const values = emptyValues(form);
  const map = WIDGET_TO_FIELD[form.id] ?? {};
  for (const [widget, field] of Object.entries(map)) {
    if (field in values) values[field] = widgets[widget] ?? "";
  }
  return values;
}

export function inspectDemoFile(fileName: string, widgets: Record<string, string>) {
  const matched = matchGuideForm(fileName);
  if (!matched) return null;
  const { form } = matched;
  const values = Object.keys(widgets).length ? valuesFromWidgets(form, widgets) : emptyValues(form);
  const started = Object.keys(widgets).length > 0 || Object.values(values).some((value) => value.trim());
  return { form, values, status: formStatus(form, values, started), widgets };
}

export const DEMO_LIBRARY = {
  complete: [
    { file: "01_W2_complete.pdf", href: "/demo-pack/Complete/01_W2_complete.pdf" },
    { file: "05_1099INT_complete.pdf", href: "/demo-pack/Complete/05_1099INT_complete.pdf" },
    { file: "08_1099NEC_complete.pdf", href: "/demo-pack/Complete/08_1099NEC_complete.pdf" },
  ],
  incomplete: [
    { file: "02_W2_missing_employer_EIN.pdf", href: "/demo-pack/Not%20Complete/02_W2_missing_employer_EIN.pdf" },
    { file: "03_W2_missing_wages.pdf", href: "/demo-pack/Not%20Complete/03_W2_missing_wages.pdf" },
    { file: "04_W2_blank_federal_withholding.pdf", href: "/demo-pack/Not%20Complete/04_W2_blank_federal_withholding.pdf" },
    { file: "06_1099INT_missing_recipient_name.pdf", href: "/demo-pack/Not%20Complete/06_1099INT_missing_recipient_name.pdf" },
    { file: "07_1099INT_blank_interest.pdf", href: "/demo-pack/Not%20Complete/07_1099INT_blank_interest.pdf" },
    { file: "09_1099NEC_blank_compensation.pdf", href: "/demo-pack/Not%20Complete/09_1099NEC_blank_compensation.pdf" },
    { file: "10_1040_partial_draft.pdf", href: "/demo-pack/10_1040_partial_draft.pdf" },
  ],
};
