import { documentClient, documentError } from '@/utils/pdf/document-request';
import { confirmedRecord, DocumentError } from '@/utils/pdf/tax-extraction.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    const client = await documentClient(request);
    const text = await request.text();
    if (text.length > 65536) throw new DocumentError('INVALID_FIELDS', 400, 'The review payload is too large.');
    let input: unknown;
    try { input = JSON.parse(text); } catch { throw new DocumentError('INVALID_FIELDS', 400, 'Provide valid JSON.'); }
    const { column, record } = confirmedRecord(input);
    const { data, error } = await client.rpc('append_profile_tax_form', { target_column: column, form_record: record });
    if (error) throw new DocumentError('SAVE_UNAVAILABLE', 503, 'Saving is unavailable. Check that the tax-form migration and your profile are set up.');
    return Response.json({ saved: true, recordId: data, column }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return documentError(error); }
}
