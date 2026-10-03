import { documentSession, documentError } from '@/utils/pdf/document-request';
import { DocumentError, extractTaxPdf, MAX_PDF_BYTES } from '@/utils/pdf/tax-extraction.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    const { user } = await documentSession(request);
    const length = Number(request.headers.get('content-length'));
    if (length > MAX_PDF_BYTES + 65536) throw new DocumentError('FILE_TOO_LARGE', 413, 'Use a PDF no larger than 8 MB.');
    if (!request.headers.get('content-type')?.startsWith('multipart/form-data')) throw new DocumentError('INVALID_UPLOAD', 400, 'Upload the PDF as multipart form data.');
    // Bound the whole multipart stream, including chunked requests without a length.
    if (!request.body) throw new DocumentError('INVALID_UPLOAD', 400, 'Choose one PDF file.');
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_PDF_BYTES + 65536) { await reader.cancel(); throw new DocumentError('FILE_TOO_LARGE', 413, 'Use a PDF no larger than 8 MB.'); }
      chunks.push(value);
    }
    const body = Buffer.concat(chunks);
    let data: FormData;
    try { data = await new Response(body, { headers: { 'Content-Type': request.headers.get('content-type')! } }).formData(); }
    catch { throw new DocumentError('INVALID_UPLOAD', 400, 'Invalid upload data.'); }
    const files = data.getAll('file');
    if (files.length !== 1 || !(files[0] instanceof File)) throw new DocumentError('INVALID_UPLOAD', 400, 'Choose one PDF file.');
    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.pdf')) throw new DocumentError('INVALID_PDF', 400, 'Choose a PDF. Photos need OCR, which is not available yet.');
    const extraction = await extractTaxPdf(new Uint8Array(await file.arrayBuffer()));
    return Response.json({ userId: user.id, extraction }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return documentError(error); }
}
