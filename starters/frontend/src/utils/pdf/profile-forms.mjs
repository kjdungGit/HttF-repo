import { createHash } from 'node:crypto';
import { DocumentError } from './tax-extraction.mjs';

// Explicit list covers both profile migrations, including payer-form columns
// that do not yet have PDF extraction templates.
export const TAX_FORM_COLUMNS = [
  'form_w2', 'form_1099_nec', 'form_1099_k', 'form_1099_misc', 'form_1099_int', 'form_1099_g',
  'form_1098_e', 'form_1098_t', 'form_1040', 'form_il_1040', 'form_4852',
  'form_8812', 'form_8880', 'form_2441', 'form_8863', 'form_8962',
  'schedule_eic', 'schedule_il_e_eitc', 'schedule_il_icr', 'schedule_1_a',
  'schedule_1', 'schedule_2', 'schedule_3', 'schedule_il_m', 'schedule_il_nr', 'schedule_il_wit',
];

export function savedFormsFromProfile(profile) {
  if (!profile) return [];
  const forms = [];
  const seen = new Set();
  for (const column of TAX_FORM_COLUMNS) {
    if (!Array.isArray(profile[column])) continue;
    for (const [index, record] of profile[column].entries()) {
      if (!record || typeof record !== 'object' || Array.isArray(record)) continue;
      const id = typeof record.id === 'string' && record.id.length > 0 && record.id.length <= 128
        ? record.id : `${column}:${index}:${createHash('sha256').update(JSON.stringify(record)).digest('hex').slice(0, 16)}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const fields = {};
      if (record.fields && typeof record.fields === 'object' && !Array.isArray(record.fields)) {
        for (const [key, value] of Object.entries(record.fields)) {
          if (value === null || typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))) fields[key] = value;
        }
      }
      forms.push({
        id,
        formType: column === 'form_8812' ? 'schedule_8812' : column.replace(/^form_/, ''),
        taxYear: Number.isInteger(record.tax_year) && record.tax_year >= 1900 && record.tax_year <= 2200 ? record.tax_year : null,
        language: typeof record.language === 'string' && /^[a-z]{2}(?:-[A-Za-z]{2})?$/.test(record.language) ? record.language : 'en',
        fields,
      });
    }
  }
  return forms;
}

export async function readSavedForms(client, userId) {
  if (typeof userId !== 'string' || !userId) throw new DocumentError('AUTH_REQUIRED', 401, 'Sign in to load saved forms.');
  // Select the owner's whole row so older deployments without new form columns
  // still work. Return only recognized form arrays, never unrelated profile data.
  const { data, error } = await client.schema('public').from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw new DocumentError('SAVED_FORMS_UNAVAILABLE', 503, 'Could not load your saved forms. Please try again.');
  return { userId, forms: savedFormsFromProfile(data) };
}
