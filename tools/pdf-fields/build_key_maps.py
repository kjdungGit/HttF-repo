"""Build language-independent monetary line maps from verified widget geometry.
1040 mappings are explicitly reviewed; other amounts require an explicit Line label
or an unambiguous printed line-number anchor directly beside the widget.
"""
import json,re
from pathlib import Path
import fitz
ROOT=Path(__file__).resolve().parents[2]
m=json.loads((ROOT/'documents/field-audit/field-manifest.json').read_text())
forms={
'f1040--2025':'1040','f1040sp--2025':'1040','il-1040':'il_1040',
'f1040s1--2025':'schedule_1','f1040s1s--2025':'schedule_1',
'f1040s1a--2025':'schedule_1_a','f1040asp--2025':'schedule_1_a',
'f1040s2--2025':'schedule_2','f1040s2s--2025':'schedule_2',
'f1040s3--2025':'schedule_3','f1040s3s--2025':'schedule_3',
'f1040s8--2025':'schedule_8812','f1040s8s--2025':'schedule_8812',
'f1040sei--2025':'schedule_eic','f1040sep--2025':'schedule_eic',
'f2441--2025':'2441','f8863--2025':'8863','f8880--2025':'8880','f8962--2025':'8962',
'il-1040-schedule-icr':'schedule_il_icr','il-1040-schedule-il-e-eic':'schedule_il_e_eitc',
'il-1040-schedule-il-wit':'schedule_il_wit','il-1040-schedule-m':'schedule_il_m','il-1040-schedule-nr':'schedule_il_nr',
'f1040lep':'1040_lep','f9000':'9000','fw10':'w10'}
aliases={'1a':'wages','1z':'total_earned_income','2a':'tax_exempt_interest','2b':'taxable_interest','3a':'qualified_dividends','3b':'ordinary_dividends','4a':'ira_distributions','4b':'taxable_ira_distributions','5a':'pensions_and_annuities','5b':'taxable_pensions_and_annuities','6a':'social_security_benefits','6b':'taxable_social_security_benefits','7a':'capital_gain_or_loss','8':'additional_income','9':'total_income','10':'adjustments_to_income','11a':'adjusted_gross_income','11b':'adjusted_gross_income_carried','12e':'deductions','13a':'qualified_business_income_deduction','13b':'additional_deductions','14':'total_deductions','15':'taxable_income','16':'income_tax','24':'total_tax','25a':'w2_federal_withholding','25b':'1099_federal_withholding','25c':'other_federal_withholding','25d':'total_federal_withholding','27a':'earned_income_credit','28':'additional_child_tax_credit','29':'american_opportunity_credit','33':'total_payments','34':'overpayment','35a':'refund','37':'amount_owed'}
# Explicit widget-number assignments verified against printed line labels.
p1={47:'1a',48:'1b',49:'1c',50:'1d',51:'1e',52:'1f',53:'1g',55:'1h',56:'1i',57:'1z',58:'2a',59:'2b',60:'3a',61:'3b',62:'4a',63:'4b',65:'5a',66:'5b',68:'6a',69:'6b',70:'7a',72:'8',73:'9',74:'10',75:'11a'}
p2={1:'11b',2:'12e',3:'13a',4:'13b',5:'14',6:'15',8:'16',9:'17',10:'18',11:'19',12:'20',13:'21',14:'22',15:'23',16:'24',17:'25a',18:'25b',19:'25c',20:'25d',21:'26',23:'27a',24:'28',25:'29',26:'30',27:'31',28:'32',29:'33',30:'34',31:'35a',34:'36',35:'37',36:'38'}
result={'version':1,'templates':[]}
for doc in m['documents']:
 if not any(p['fields'] for p in doc['pages']):continue
 form=forms[Path(doc['file']).stem];lang='es' if doc['file'].startswith('Spanish') else 'en'
 pdf=fitz.open(ROOT/doc['file']); entries=[]
 for page in doc['pages']:
  words=pdf[page['page']-1].get_text('words')
  for f in page['fields']:
   line=None;method=None
   if f['type']=='Text':
    if form=='1040':
     n=int(re.search(r'f\d_(\d+)\[',f['name']).group(1))
     if page['page']==1:line=p1.get(n) if lang=='en' or n<74 else None
     elif lang=='en':line=p2.get(n)
     else:line={1:'10',2:'11a',**{k+2:v for k,v in p2.items()}}.get(n)
     if line:method='reviewed_1040_line'
    elif re.match(r'^Line (\d{1,2}[a-z]?)\b',f['label'] or ''):
     line=re.match(r'^Line (\d{1,2}[a-z]?)\b',f['label']).group(1);method='explicit_pdf_line_label'
    elif form not in ['1040_lep','9000','w10','schedule_eic']:
     x0,y0,x1,y1=f['rect']
     if x0>=200 and x1-x0>=30:
      candidates=[(x0-wx1,t) for wx0,wy0,wx1,wy1,t,*_ in words if re.fullmatch(r'\d{1,2}[a-z]?',t) and 0<=x0-wx1<=25 and abs((wy0+wy1)/2-(y0+y1)/2)<=4]
      if candidates:line=min(candidates)[1];method='printed_line_anchor'
   key=(aliases.get(line,'line_'+line) if form=='1040' else 'line_'+line) if line else None
   entries.append({'page':page['page'],'name':f['name'],'rect':f['rect'],'type':f['type'],'key':key,'line':line,'mappingEvidence':method})
 # Repeated line labels (tables or instruction references) are ambiguous. Omit them.
 counts={key:sum(e['key']==key for e in entries) for key in {e['key'] for e in entries if e['key']}}
 for e in entries:
  if e['key'] and counts[e['key']]>1:e.update(key=None,mappingEvidence='ambiguous_repeated_line')
 result['templates'].append({'id':Path(doc['file']).stem,'formType':form,'language':lang,'taxYear':2025 if form not in ['1040_lep','9000','w10'] else None,'source':doc['file'],'sourceHash':doc['sha256'],'pages':[{'width':p['width'],'height':p['height']} for p in doc['pages']],'fields':entries})
path=ROOT/'starters/frontend/src/utils/pdf/tax-templates.json';path.write_text(json.dumps(result,indent=2)+'\n')
print([(t['id'],sum(bool(f['key']) for f in t['fields'])) for t in result['templates']])
