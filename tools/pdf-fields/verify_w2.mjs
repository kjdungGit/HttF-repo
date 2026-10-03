// Independently cross-check every W-2 widget against PDF.js.
// PDFJS_MODULE=/absolute/path/pdfjs-dist/legacy/build/pdf.mjs node tools/pdf-fields/verify_w2.mjs
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const {getDocument}=await import(process.env.PDFJS_MODULE||'pdfjs-dist/legacy/build/pdf.mjs');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const {templates}=JSON.parse(fs.readFileSync(path.join(root,'documents/w2-verification/templates.json')));
let checked=0,maxDelta=0;
for(const template of templates){const bytes=fs.readFileSync(path.join(root,template.source));assert.equal(createHash('sha256').update(bytes).digest('hex'),template.sourceHash);const task=getDocument({data:new Uint8Array(bytes)});try{const pdf=await task.promise;assert.equal(pdf.numPages,template.pages.length);for(let number=1;number<=pdf.numPages;number++){const page=await pdf.getPage(number);const viewport=page.getViewport({scale:1,rotation:0});const widgets=(await page.getAnnotations()).filter(a=>a.subtype==='Widget'&&!a.pushButton);const expected=template.fields.filter(f=>f.page===number);assert.equal(widgets.length,expected.length);for(const field of expected){const actual=widgets.find(a=>a.fieldName===field.name);assert.ok(actual,field.name);const a=viewport.convertToViewportPoint(actual.rect[0],actual.rect[1]);const b=viewport.convertToViewportPoint(actual.rect[2],actual.rect[3]);const rect=[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])];const delta=Math.max(...rect.map((v,i)=>Math.abs(v-field.rect[i])));assert.ok(delta<=.02,field.name);maxDelta=Math.max(maxDelta,delta);checked++;}}}finally{await task.destroy();}}
const result={checked,maxDelta,passed:true};fs.writeFileSync(path.join(root,'documents/w2-verification/verification.json'),JSON.stringify(result,null,2)+'\n');console.log(result);
