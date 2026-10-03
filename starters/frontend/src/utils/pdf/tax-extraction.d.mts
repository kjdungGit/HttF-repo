export class DocumentError extends Error { code: string; status: number; constructor(code: string, status: number, message: string); }
export const MAX_PDF_BYTES: number;
export type Extraction = { recordId: string; templateId: string; formType: string; language: string; taxYear: number | null; sourceHash: string; fields: Record<string, string | null>; evidence: Record<string, {page:number;line:string;fieldName:string;rect:number[];method:string;status:string}>; warnings: string[] };
export function extractTaxPdf(buffer: Uint8Array): Promise<Extraction>;
export function confirmedRecord(input: unknown): {column:string;record:Record<string, unknown>};
