export type FormId = "w2" | "nec" | "int" | "e" | "t" | "g" | "a" | "prior";

export type FormField = {
  key: string;
  required: boolean;
};

export type GuideForm = {
  id: FormId;
  pdf: string;
  match: string[];
  fields: FormField[];
};

export const GUIDE_FORMS: GuideForm[] = [
  {
    id: "w2",
    pdf: "/forms/w2.pdf",
    match: ["w2", "w-2"],
    fields: [
      { key: "employeeName", required: true },
      { key: "employerName", required: true },
      { key: "ein", required: true },
      { key: "wages", required: true },
      { key: "federalWithheld", required: true },
      { key: "ssWages", required: false },
      { key: "stateWages", required: false },
    ],
  },
  {
    id: "nec",
    pdf: "/forms/nec.pdf",
    match: ["1099-nec", "1099nec", "nec", "1099-k", "1099-misc"],
    fields: [
      { key: "payerName", required: true },
      { key: "recipientName", required: true },
      { key: "compensation", required: true },
      { key: "federalWithheld", required: false },
      { key: "stateIncome", required: false },
    ],
  },
  {
    id: "int",
    pdf: "/forms/int.pdf",
    match: ["1099-int", "1099int", "interest"],
    fields: [
      { key: "payerName", required: true },
      { key: "recipientName", required: true },
      { key: "interest", required: true },
      { key: "federalWithheld", required: false },
    ],
  },
  {
    id: "e",
    pdf: "/forms/e.pdf",
    match: ["1098-e", "1098e"],
    fields: [
      { key: "lenderName", required: true },
      { key: "borrowerName", required: true },
      { key: "loanInterest", required: true },
    ],
  },
  {
    id: "t",
    pdf: "/forms/t.pdf",
    match: ["1098-t", "1098t"],
    fields: [
      { key: "schoolName", required: true },
      { key: "studentName", required: true },
      { key: "tuition", required: true },
      { key: "grants", required: false },
    ],
  },
  {
    id: "g",
    pdf: "/forms/g.pdf",
    match: ["1099-g", "1099g"],
    fields: [
      { key: "agencyName", required: true },
      { key: "recipientName", required: true },
      { key: "unemployment", required: true },
      { key: "federalWithheld", required: false },
    ],
  },
  {
    id: "a",
    pdf: "/forms/a.pdf",
    match: ["1095-a", "1095a"],
    fields: [
      { key: "marketplaceName", required: true },
      { key: "recipientName", required: true },
      { key: "premium", required: true },
      { key: "advanceCredit", required: true },
    ],
  },
  {
    id: "prior",
    pdf: "/forms/prior.pdf",
    match: ["1040", "prior", "il-1040"],
    fields: [
      { key: "taxYear", required: false },
      { key: "filingName", required: true },
      { key: "wagesNoted", required: false },
      { key: "taxableInterest", required: true },
    ],
  },
];

export type FormStatus = "missing" | "incomplete" | "complete";

export type FormPacket = {
  values: Record<string, string>;
  status: FormStatus;
  sourceKind: "blank" | "upload";
  sourceName?: string;
};

export function emptyValues(form: GuideForm): Record<string, string> {
  return Object.fromEntries(form.fields.map((field) => [field.key, ""]));
}

export function formStatus(form: GuideForm, values: Record<string, string>, started: boolean): FormStatus {
  const required = form.fields.filter((field) => field.required);
  const filled = required.filter((field) => Boolean(values[field.key]?.trim()));
  if (filled.length === required.length) return "complete";
  if (started || filled.length > 0) return "incomplete";
  return "missing";
}

export function missingRequired(form: GuideForm, values: Record<string, string>) {
  return form.fields.filter((field) => field.required && !values[field.key]?.trim()).map((field) => field.key);
}

export function matchGuideForm(fileName: string): { form: GuideForm; demo: "complete" | "incomplete" | null } | null {
  const name = fileName.toLowerCase().replaceAll(" ", "");
  const demo = /notcomplete|incomplete|missing|blank|partial/.test(name)
    ? "incomplete"
    : name.includes("complete")
      ? "complete"
      : null;
  const form = GUIDE_FORMS.find((item) => item.match.some((token) => name.includes(token.replaceAll("-", "")) || name.includes(token)));
  return form ? { form, demo } : null;
}

export function demoValues(form: GuideForm, demo: "complete" | "incomplete") {
  const values = emptyValues(form);
  for (const field of form.fields) {
    values[field.key] = demo === "complete" || !field.required ? `Demo ${field.key}` : "";
  }
  if (demo === "incomplete") {
    const first = form.fields.find((field) => field.required);
    if (first) values[first.key] = `Demo ${first.key}`;
  }
  return values;
}

export function mapExtractedForm(formType: string): FormId | null {
  if (formType === "1040") return "prior";
  return null;
}
