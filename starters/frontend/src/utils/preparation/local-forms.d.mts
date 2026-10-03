export type LocalForm = {
  id: string;
  form_type: string;
  tax_year: number;
  language: "en" | "es";
  status: "reviewed";
  fields: Record<string, string>;
  issuer?: string;
  template_id?: string;
  source: "pdf" | "manual";
};
export const FORMS_KEY: string;
export class LocalStorageError extends Error {
  code: string;
}
export function readLocalForms(storage?: Storage): LocalForm[];
export function recordLocalForm(
  record: unknown,
  storage?: Storage,
): LocalForm[];
export function formsBackup(storage?: Storage): object;
export function restoreFormsBackup(
  input: unknown,
  storage?: Storage,
): LocalForm[];
