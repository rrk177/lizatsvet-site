"""Fill the photo (<!--GALLERY:cat-->) and video (<!--VIDEOS:cat-->) slots in index.html.

Run from the project root:  python3 tools/build_galleries.py
Photos come from tools/data.js, videos from tools/videos.json
(her Vimeo showcase 12133794 and YouTube playlist «Мои проекты»; covers are in assets/video/).
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


from html import escape
VIDEOS = json.loads((ROOT / 'tools/videos.json').read_text(encoding='utf-8'))

def video(v):
    full = f"{v['artist']} — {v['title']}" if v['title'] else v['artist']
    return (f'<button class="vitem" type="button" data-provider="{v["provider"]}" data-id="{v["id"]}" data-title="{escape(full)}">'
            f'<span class="vitem__thumb"><img src="{v["thumb"]}" alt="" loading="lazy" decoding="async" width="960" height="540">'
            f'<span class="vitem__play"><svg><use href="#i-play"/></svg></span></span>'
            f'<span class="vitem__text"><b>{escape(v["artist"])}</b><span>{escape(v["title"])}</span></span></button>')

p = ROOT / 'index.html'
html = p.read_text(encoding='utf-8')
for cat in ('ads', 'clips'):
    body = '\n        '.join(video(v) for v in VIDEOS if v['cat'] == cat)
    html, n = re.subn(rf'<!--VIDEOS:{cat}-->.*?<!--/VIDEOS-->',
                      f'<!--VIDEOS:{cat}-->\n        {body}\n      <!--/VIDEOS-->', html, count=1, flags=re.S)
    assert n == 1, cat
p.write_text(html, encoding='utf-8')
print('videos ok:', {c: sum(v['cat'] == c for v in VIDEOS) for c in ('ads', 'clips')})
