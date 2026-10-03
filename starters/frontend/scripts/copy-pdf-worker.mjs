import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { mkdir, copyFile, cp } from 'node:fs/promises';
const require=createRequire(import.meta.url);
const packageRoot=dirname(require.resolve('pdfjs-dist/package.json'));
await mkdir('public/pdfjs',{recursive:true});
await copyFile(join(packageRoot,'build/pdf.worker.min.mjs'),'public/pdfjs/pdf.worker.min.mjs');

for(const asset of ['standard_fonts','wasm']) await cp(join(packageRoot,asset),join('public/pdfjs',asset),{recursive:true});
