import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeBox, selectTemplate } from './box_rules.mjs';
const manifest = JSON.parse(fs.readFileSync(new URL('../../documents/field-audit/field-manifest.json', import.meta.url)));
const summary = {};
for (const document of manifest.documents) {
  assert.equal(selectTemplate(manifest, document.sha256), document);
  const language = document.file.startsWith('Spanish') ? 'Spanish' : 'English';
  summary[language] ??= { documents: 0, entryFields: 0, normalizedBoxesVerified: 0 };
  summary[language].documents++;
  for (const page of document.pages) for (const field of page.fields) {
    const box = normalizeBox(field.rect, page.width, page.height);
    for (const key of Object.keys(box)) assert.ok(Math.abs(box[key] - field.normalized[key]) < 1e-10);
    // A viewer at a different zoom must map back to the same source region.
    for (const scale of [0.5, 1, 2]) {
      const pixels = field.rect.map(value => value * scale);
      const scaledBox = normalizeBox(pixels, page.width * scale, page.height * scale);
      for (const key of Object.keys(box)) assert.ok(Math.abs(box[key] - scaledBox[key]) < 1e-10);
    }
    summary[language].entryFields++;
    summary[language].normalizedBoxesVerified++;
  }
}
assert.throws(() => selectTemplate(manifest, 'unknown-document-hash'), /Unverified document/);
assert.throws(() => normalizeBox([-1,0,10,10],612,792), /outside page/);
// Corresponding translated forms can have different layouts. English boxes cannot
// be selected for Spanish by form number alone or by an opaque field name.
const english1040 = manifest.documents.find(d => d.file === 'English Tax Forms/f1040--2025.pdf');
const spanish1040 = manifest.documents.find(d => d.file === 'Spanish Tax Forms/f1040sp--2025.pdf');
let commonFields = 0, movedFields = 0;
for (const page of english1040.pages) for (const field of page.fields) {
  const translated = spanish1040.pages.find(p => p.page === page.page)?.fields.find(f => f.name === field.name);
  if (!translated) continue;
  commonFields++;
  if (Math.max(...field.rect.map((v, i) => Math.abs(v - translated.rect[i]))) > .02) movedFields++;
}
assert.ok(movedFields > 0, 'Regression fixture must demonstrate translated layout differences');
const result = { passed: true, sharedRules: 'Identical normalization and bounds checks for both languages; document-specific boxes', languages: summary, englishSpanish1040: { commonFieldNames: commonFields, differentRectangles: movedFields }, unknownTemplatesRejected: true };
fs.writeFileSync(new URL('../../documents/field-audit/multilingual-verification.json', import.meta.url), JSON.stringify(result, null, 2)+'\n');
console.log(JSON.stringify(result));
