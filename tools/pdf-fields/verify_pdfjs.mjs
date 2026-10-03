// Cross-check the manifest with PDF.js, independently of PyMuPDF.
// Usage: PDFJS_MODULE=/absolute/path/pdfjs-dist/legacy/build/pdf.mjs node tools/pdf-fields/verify_pdfjs.mjs
import fs from 'node:fs';
import { viewportBox, selectTemplate } from './box_rules.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { getDocument } = await import(process.env.PDFJS_MODULE || 'pdfjs-dist/legacy/build/pdf.mjs');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, 'documents/field-audit');
const manifest = JSON.parse(fs.readFileSync(path.join(out, 'field-manifest.json')));
const result = { tolerancePoints: 0.02, checked: 0, maximumCoordinateDifference: 0, failures: [], additionalWidgets: [], documentHashesVerified: true };
const { createHash } = await import('node:crypto');
for (const doc of manifest.documents) {
  const bytes = fs.readFileSync(path.join(root, doc.file));
  if(selectTemplate(manifest, createHash('sha256').update(bytes).digest('hex')) !== doc) { result.documentHashesVerified = false; result.failures.push({ file: doc.file, reason: 'Source hash changed' }); }
  const standardFontDataUrl = process.env.PDFJS_MODULE ? path.resolve(path.dirname(process.env.PDFJS_MODULE), '../../standard_fonts') + '/' : undefined;
  const task = getDocument({ data: new Uint8Array(bytes), isEvalSupported: false, standardFontDataUrl });
  const pdf = await task.promise;
  for (const expected of doc.pages) {
    const page = await pdf.getPage(expected.page);
    const viewport = page.getViewport({scale: 1, rotation: 0});
    const widgets = (await page.getAnnotations()).filter(a=>a.subtype === 'Widget' && !a.pushButton);
    if (widgets.length !== expected.fields.length) result.failures.push({file: doc.file, page: expected.page, reason: 'Field count mismatch', actual: widgets.length, expected: expected.fields.length});
    for (const field of expected.fields) {
      const actual = widgets.find(a=>a.id === `${field.id}R`);
      if (!actual) { result.failures.push({file:doc.file,page:expected.page,id:field.id,reason:'Missing widget'}); continue; }
      const { rect: normalized, normalized: fractions } = viewportBox(actual.rect, viewport);
      const fractionDelta = Math.max(...Object.keys(fractions).map(key => Math.abs(fractions[key] - field.normalized[key])));
      if (fractionDelta > 0.000001) result.failures.push({file:doc.file,page:expected.page,id:field.id,reason:'Normalized coordinate mismatch', fractionDelta});
      const delta = Math.max(...normalized.map((v,i)=>Math.abs(v-field.rect[i])));
      result.maximumCoordinateDifference = Math.max(result.maximumCoordinateDifference, delta);
      if(delta > result.tolerancePoints || actual.fieldName !== field.name) result.failures.push({file:doc.file,page:expected.page,id:field.id,reason:'Coordinate/name mismatch', delta});
      result.checked++;
    }
  }
  await task.destroy();
}
result.passed = result.failures.length === 0;
fs.writeFileSync(path.join(out,'pdfjs-verification.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
if(!result.passed) process.exitCode=1;
