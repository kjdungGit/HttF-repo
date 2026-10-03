// Test adapter for the same browser extraction rules, using PDF.js' Node engine.
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  getDocument,
  GlobalWorkerOptions,
} from "pdfjs-dist/legacy/build/pdf.mjs";
import { extractTaxPdf as extract } from "../src/utils/pdf/tax-extraction.mjs";
const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = pathToFileURL(
  require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs"),
).href;
const fonts =
  join(dirname(require.resolve("pdfjs-dist/package.json")), "standard_fonts") +
  "/";
export const extractTaxPdf = (buffer) =>
  extract(buffer, {
    getDocument: (options) =>
      getDocument({ ...options, standardFontDataUrl: fonts }),
  });
