#!/usr/bin/env python3
"""Inline css/, data/ and src/ into one self-contained HTML file.

Usage: python3 tools/build_single.py [out.html]   (default: dist/seafloor-single.html)
The single file is what gets published as a Claude artifact; the repo itself is
served as-is by GitHub Pages and needs no build step.
"""
import json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'dist', 'seafloor-single.html')
read = lambda p: open(os.path.join(ROOT, p), encoding='utf-8').read()
html = read('index.html')
html = html.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + read('css/style.css') + '</style>')
for p in ('data/etopo20.js', 'src/main.js'):
    tag = '<script src="%s"></script>' % p
    assert tag in html, tag
    html = html.replace(tag, '<script>\n' + read(p) + '</script>')
# narration text for the browser-speech fallback (the single file has no audio/ folder next to it)
narr = read('narration/tour.json')
assert 'const NARR_INLINE=null;' in html
html = html.replace('const NARR_INLINE=null;', 'const NARR_INLINE=' + json.dumps(json.loads(narr), ensure_ascii=False) + ';')
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w', encoding='utf-8').write(html)
print('wrote', out, '%.2f MB' % (len(html.encode()) / 1e6))
