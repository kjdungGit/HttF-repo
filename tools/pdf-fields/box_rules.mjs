/** Shared geometry rules for every language. Never reuse boxes across document hashes. */
export function normalizeBox(rect, width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 ||
      !Array.isArray(rect) || rect.length !== 4 || !rect.every(Number.isFinite)) throw new Error('Invalid page or rectangle');
  const [x0, y0, x1, y1] = rect;
  if (x0 < 0 || y0 < 0 || x1 > width || y1 > height || x1 <= x0 || y1 <= y0) throw new Error('Rectangle outside page');
  return { x: x0 / width, y: y0 / height, width: (x1 - x0) / width, height: (y1 - y0) / height };
}

export function viewportBox(pdfRect, viewport) {
  // PDF.js handles y direction, crop offsets, scaling and page rotation.
  const first = viewport.convertToViewportPoint(pdfRect[0], pdfRect[1]);
  const second = viewport.convertToViewportPoint(pdfRect[2], pdfRect[3]);
  const rect = [Math.min(first[0], second[0]), Math.min(first[1], second[1]), Math.max(first[0], second[0]), Math.max(first[1], second[1])];
  return { rect, normalized: normalizeBox(rect, viewport.width, viewport.height) };
}

export function selectTemplate(manifest, documentHash) {
  const template = manifest.documents.find(document => document.sha256 === documentHash);
  if (!template) throw new Error('Unverified document: extract and verify its own boxes before use');
  return template;
}
