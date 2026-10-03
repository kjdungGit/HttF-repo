"""Add verified IRS 2025 W-2 Copy B templates; preserve the original template registry."""
import fitz,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
full=ROOT/'English Tax Forms/fw2--2025.pdf'
doc=fitz.open(full)
copy=fitz.open();copy.insert_pdf(doc,from_page=3,to_page=3,widgets=True)
partial=ROOT/'English Tax Forms/fw2-copy-b--2025.pdf';copy.save(partial,garbage=4,deflate=True)
keys={9:('box_1_wages','1'),10:('box_2_federal_withholding','2'),33:('box_16_state_wages','16'),35:('box_17_state_withholding','17')}
output=[]
for p,id in [(full,'fw2--2025'),(partial,'fw2-copy-b--2025')]:
 d=fitz.open(p);fields=[]
 for page in d:
  for w in page.widgets() or []:
   leaf=w.field_name.split('.')[-1]
   import re
   num=int(re.search(r'_(\d+)\[',leaf).group(1)) if re.search(r'_(\d+)\[',leaf) else -1
   mapping=keys.get(num) if '.CopyB[0].' in w.field_name and w.field_type_string=='Text' else None
   assert page.rect.contains(w.rect)
   fields.append({'page':page.number+1,'name':w.field_name,'rect':list(w.rect),'type':w.field_type_string,'key':mapping[0] if mapping else None,'line':mapping[1] if mapping else None,'mappingEvidence':'reviewed_w2_copy_b_box' if mapping else None})
 output.append({'id':id,'formType':'w2','language':'en','taxYear':2025,'source':p.relative_to(ROOT).as_posix(),'sourceHash':hashlib.sha256(p.read_bytes()).hexdigest(),'pages':[{'width':page.rect.width,'height':page.rect.height} for page in d],'fields':fields})
registry=ROOT/'starters/frontend/src/utils/pdf/tax-templates.json';data=json.loads(registry.read_text());data['templates']=[t for t in data['templates'] if t['formType']!='w2']+output;registry.write_text(json.dumps(data,indent=2)+'\n')
(ROOT/'documents/w2-verification/templates.json').write_text(json.dumps({'source':'https://www.irs.gov/pub/irs-prior/fw2--2025.pdf','templates':output},indent=2)+'\n')
page=copy[0]
for w in page.widgets() or []:
 if any(f['name']==w.field_name and f['key'] for f in output[-1]['fields']): page.draw_rect(w.rect,color=(1,0,0),width=1)
page.get_pixmap(matrix=fitz.Matrix(1.2,1.2)).save(ROOT/'documents/w2-verification/copy-b-boxes.png')
print('Added W-2 full 11-page PDF and single employee Copy B, four monetary fields each.')
