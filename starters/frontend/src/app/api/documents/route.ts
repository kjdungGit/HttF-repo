import { documentSession, documentError } from '@/utils/pdf/document-request';
import { readSavedForms } from '@/utils/pdf/profile-forms.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    const { client, user } = await documentSession(request);
    const result = await readSavedForms(client, user.id);
    return Response.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return documentError(error); }
}
