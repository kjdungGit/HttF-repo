import type { SupabaseClient } from '@supabase/supabase-js';
export type SavedForm = { id: string; formType: string; taxYear: number | null; language: string; fields: Record<string, string | number | null> };
export const TAX_FORM_COLUMNS: string[];
export function savedFormsFromProfile(profile: Record<string, unknown> | null): SavedForm[];
export function readSavedForms(client: SupabaseClient, userId: string): Promise<{userId: string; forms: SavedForm[]}>;
