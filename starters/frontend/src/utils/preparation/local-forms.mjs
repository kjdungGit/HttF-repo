import { decimalValue, templates } from "../pdf/tax-extraction.mjs";
export const FORMS_KEY = "keenfinance:forms:v1";
export class LocalStorageError extends Error {
  constructor() {
    super(
      "Browser storage is unavailable or the saved forms are invalid. Download a backup before leaving.",
    );
    this.code = "STORAGE_UNAVAILABLE";
  }
}
function normalize(input) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    typeof input.id !== "string" ||
    !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(
      input.id,
    )
  )
    throw new LocalStorageError();
  const candidates = templates.filter(
    (t) => t.formType === input.form_type && t.taxYear === input.tax_year,
  );
  if (
    !candidates.length ||
    !input.fields ||
    typeof input.fields !== "object" ||
    Array.isArray(input.fields)
  )
    throw new LocalStorageError();
  const allowed = new Set(
    candidates.flatMap((t) => t.fields.filter((f) => f.key).map((f) => f.key)),
  );
  const fields = {};
  for (const [key, value] of Object.entries(input.fields)) {
    if (!allowed.has(key)) throw new LocalStorageError();
    if (value === null || value === "") continue;
    const amount = decimalValue(
      typeof value === "string" && value.endsWith(".")
        ? value.slice(0, -1)
        : value,
    );
    if (amount === null) throw new LocalStorageError();
    fields[key] = amount;
  }
  if (!Object.keys(fields).length) throw new LocalStorageError();
  return {
    id: input.id,
    form_type: input.form_type,
    tax_year: input.tax_year,
    language: input.language === "es" ? "es" : "en",
    status: "reviewed",
    fields,
    ...(typeof input.issuer === "string"
      ? { issuer: input.issuer.slice(0, 100) }
      : {}),
    ...(typeof input.template_id === "string" &&
    candidates.some((t) => t.id === input.template_id)
      ? { template_id: input.template_id }
      : {}),
    source: input.source === "pdf" ? "pdf" : "manual",
  };
}
export function readLocalForms(storage = globalThis.localStorage) {
  try {
    const value = storage.getItem(FORMS_KEY);
    if (!value) return [];
    const records = JSON.parse(value);
    if (!Array.isArray(records) || records.length > 100) throw Error();
    return records.map(normalize);
  } catch {
    throw new LocalStorageError();
  }
}
export function recordLocalForm(record, storage = globalThis.localStorage) {
  try {
    const clean = normalize(record);
    const existing = readLocalForms(storage);
    if (existing.some((r) => r.id === clean.id)) return existing;
    if (existing.length >= 100) throw Error();
    const records = [...existing, clean];
    storage.setItem(FORMS_KEY, JSON.stringify(records));
    return records;
  } catch {
    throw new LocalStorageError();
  }
}
export function formsBackup(storage = globalThis.localStorage) {
  return {
    product: "KEENFinance",
    format: "forms-backup",
    version: 1,
    forms: readLocalForms(storage),
  };
}
export function restoreFormsBackup(input, storage = globalThis.localStorage) {
  try {
    if (
      input?.product !== "KEENFinance" ||
      input?.format !== "forms-backup" ||
      input?.version !== 1 ||
      !Array.isArray(input.forms) ||
      input.forms.length > 100
    )
      throw Error();
    const validated = input.forms.map(normalize);
    const records = [
      ...new Map(
        [...readLocalForms(storage), ...validated].map((r) => [r.id, r]),
      ).values(),
    ];
    if (records.length > 100) throw Error();
    storage.setItem(FORMS_KEY, JSON.stringify(records));
    return records;
  } catch {
    throw new LocalStorageError();
  }
}
