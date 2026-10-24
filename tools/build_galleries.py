"""Fill the <!--GALLERY:cat--><!--/GALLERY--> slots in index.html.

Run from the project root:  python3 tools/build_galleries.py
Image list comes from tools/data.js (generated from lizatsvet.ru).
"""
import json, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / 'tools/data.js').read_text(encoding='utf-8')
WORKS = json.loads(src[src.index('{'):src.rindex('}') + 1])
NAMES = {'makeup': 'Макияж', 'sfx': 'Грим и SFX', 'hair': 'Причёски'}

def item(cat, i, f, w, h):
    wide = ' gal__item--wide' if w / h > 1.1 else ''
    n = len(WORKS[cat])
    return (f'<a class="gal__item{wide}" href="assets/img/{f}" data-pswp-width="{w}" data-pswp-height="{h}" '
            f'data-caption="{NAMES[cat]} · {i:02d} / {n:02d}">'
            f'<img src="assets/img/md/{f}" alt="{NAMES[cat]} — работа Елизаветы Цветковой, {i}" loading="lazy" decoding="async" width="{w}" height="{h}"></a>')

for page, fn in (('index.html', item),):
    p = ROOT / page
    html = p.read_text(encoding='utf-8')
    for cat, items in WORKS.items():
        body = '\n        '.join(fn(cat, k + 1, *it) for k, it in enumerate(items))
        html = re.sub(rf'<!--GALLERY:{cat}-->.*?<!--/GALLERY-->',
                      f'<!--GALLERY:{cat}-->\n        {body}\n      <!--/GALLERY-->', html, count=1, flags=re.S)
    p.write_text(html, encoding='utf-8')
    print(page, 'ok')

