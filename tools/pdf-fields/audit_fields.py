"""Extract existing PDF widgets for geometry review; does not parse tax values.
Requires PyMuPDF (fitz). Run from repository root.
"""
import hashlib
import json
from pathlib import Path
import fitz

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'documents/field-audit'
DIRECTORIES = ['English Tax Forms', 'Spanish Tax Forms', 'English Tax Explanations', 'Spanish Tax Explainations']
manifest = {'source_commit': '88c006d', 'coordinate_system': 'points, top-left origin, unrotated crop page; normalized x/y/width/height', 'documents': []}
preview = fitz.open()
for directory in DIRECTORIES:
    for path in sorted((ROOT / directory).glob('*.pdf')):
        doc = fitz.open(path)
        entry = {'file': path.relative_to(ROOT).as_posix(), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'pages': [], 'excluded_buttons': 0}
        for page in doc:
            fields = []
            for w in page.widgets() or []:
                if w.field_type_string == 'Button':
                    entry['excluded_buttons'] += 1
                    continue
                r = w.rect
                valid = r.width > 0 and r.height > 0 and page.rect.contains(r)
                fields.append({'id': w.xref, 'name': w.field_name, 'label': w.field_label, 'type': w.field_type_string, 'rect': list(r), 'normalized': {'x': r.x0/page.rect.width, 'y': r.y0/page.rect.height, 'width': r.width/page.rect.width, 'height': r.height/page.rect.height}, 'within_page': valid})
            entry['pages'].append({'page': page.number+1, 'width': page.rect.width, 'height': page.rect.height, 'rotation': page.rotation, 'fields': fields})
            if fields:
                preview.insert_pdf(doc, from_page=page.number, to_page=page.number)
                overlay = preview[-1]
                for field in fields:
                    overlay.draw_rect(fitz.Rect(field['rect']), color=(1, 0, 0), width=0.65, overlay=True)
                # Explicit source caption at the bottom margin.
                overlay.insert_text((10, 785), f"{entry['file']} | page {page.number+1}", fontsize=6, color=(1,0,0))
        manifest['documents'].append(entry)
OUT.mkdir(parents=True, exist_ok=True)
(OUT/'previews').mkdir(exist_ok=True)
(OUT/'field-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
preview.save(OUT/'field-overlays.pdf', garbage=4, deflate=True)
# Representative full-size previews, one from every form, in original ordering.
for doc in manifest['documents']:
    if not any(p['fields'] for p in doc['pages']): continue
    original = fitz.open(ROOT/doc['file'])
    page = original[0]
    for field in doc['pages'][0]['fields']:
        page.draw_rect(fitz.Rect(field['rect']), color=(1,0,0), width=.65)
    slug = Path(doc['file']).parent.name.replace(' ', '-')+'-'+Path(doc['file']).stem
    page.get_pixmap(matrix=fitz.Matrix(1.25,1.25)).save(OUT/'previews'/f'{slug}.png')
fields = [f for d in manifest['documents'] for p in d['pages'] for f in p['fields']]
print(json.dumps({'documents': len(manifest['documents']), 'entry_fields': len(fields), 'outside_page': sum(not f['within_page'] for f in fields), 'overlay_pages': len(preview), 'excluded_buttons': sum(d['excluded_buttons'] for d in manifest['documents'])}))
