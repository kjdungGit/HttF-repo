import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { mkdir, copyFile } from 'node:fs/promises';
const require=createRequire(import.meta.url);
const packageRoot=dirname(require.resolve('pdfjs-dist/package.json'));
await mkdir('public/pdfjs',{recursive:true});
await copyFile(join(packageRoot,'build/pdf.worker.min.mjs'),'public/pdfjs/pdf.worker.min.mjs');
