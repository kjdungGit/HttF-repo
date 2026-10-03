"""Synthetic filled PDFs; values are test data, not taxpayer records."""
from pathlib import Path
import fitz
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'starters/frontend/tests/fixtures/pdf'
OUT.mkdir(parents=True,exist_ok=True)
cases=[('English Tax Forms/f1040--2025.pdf','1040-en.pdf',{(1,'f1_47[0]'):'42,000.25',(1,'f1_74[0]'):'1000.00',(2,'f2_20[0]'):'4500.50',(2,'f2_32[0]'):'999999999'}),('Spanish Tax Forms/f1040sp--2025.pdf','1040-es.pdf',{(1,'f1_47[0]'):'42,000.25',(2,'f2_01[0]'):'1000.00',(2,'f2_22[0]'):'4500.50',(2,'f2_34[0]'):'999999999'}),('English Tax Forms/f1040s2--2025.pdf','schedule2-en.pdf',{(1,'f1_15[0]'):'123.45'}),('Spanish Tax Forms/f1040s2s--2025.pdf','schedule2-es.pdf',{(1,'f1_18[0]'):'123.45'})]
for source,name,values in cases:
 doc=fitz.open(ROOT/source)
 for p in doc:
  for w in p.widgets() or []:
   key=(p.number+1,w.field_name.split('.')[-1])
   if key in values:w.field_value=values[key];w.update()
 doc.save(OUT/name,garbage=4,deflate=True)
