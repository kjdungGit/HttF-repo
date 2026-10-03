import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { DocumentError } from './tax-extraction.mjs';

export async function documentSession(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) throw new DocumentError('INVALID_ORIGIN', 403, 'Same-origin request required.');
  const client = createClient(await cookies());
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new DocumentError('AUTH_REQUIRED', 401, 'Sign in to access your tax forms.');
  return { client, user: data.user };
}
export async function documentClient(request: Request) {
  return (await documentSession(request)).client;
}

export function documentError(error: unknown) {
  return Response.json({ error: { code: error instanceof DocumentError ? error.code : 'DOCUMENT_REQUEST_FAILED', message: error instanceof DocumentError ? error.message : 'Unable to process the document request.' } },
    { status: error instanceof DocumentError ? error.status : 503, headers: { 'Cache-Control': 'private, no-store' } });
}
