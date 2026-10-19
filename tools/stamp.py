#!/usr/bin/env python3
"""Add ?v=<content hash> to the css/js references in index.html so browsers fetch new files after each update.
Run before committing:  python3 tools/stamp.py"""
import hashlib, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
p = os.path.join(ROOT, 'index.html'); html = open(p, encoding='utf-8').read()
for f in ('css/style.css', 'js/seafloor.js', 'i18n/en.js'):
    h = hashlib.sha1(open(os.path.join(ROOT, f), 'rb').read()).hexdigest()[:8]
    html, n = re.subn(r'(["\'])' + re.escape(f) + r'(\?v=[0-9a-f]+)?\1', r'\g<1>%s?v=%s\g<1>' % (f, h), html)
    assert n == 1, f
open(p, 'w', encoding='utf-8').write(html); print('stamped')
