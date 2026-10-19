#!/usr/bin/env python3
"""Repository checks, run by CI on every push and handy before committing:

    python3 tools/check.py

1. js/seafloor.js matches src/ (tools/build.py --check) and passes `node --check`
2. index.html carries the current ?v= stamps for css/js (tools/stamp.py)
3. narration/tour.json is valid, ids are unique, and every line has a generated clip
   (missing clips are a warning: the workflow that makes them may not have run yet)
4. every tour stop in the code has a narration line
5. docs/CHANGELOG.md, ROADMAP.md and SOURCES.md match the in-page log (tools/sync_docs.py)
6. every Chinese string has an English translation and i18n/en.js is current (tools/i18n.py);
   narration/tour.en.json has the same ids as tour.json (missing English clips are a warning)
"""
import hashlib, json, os, re, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
read = lambda *a: open(P(*a), encoding='utf-8').read()
errors, warnings = [], []

r = subprocess.run([sys.executable, P('tools', 'build.py'), '--check'], capture_output=True, text=True)
(errors if r.returncode else []).append('build: ' + (r.stderr or r.stdout).strip())

html = read('index.html')
for f in ('css/style.css', 'js/seafloor.js', 'i18n/en.js'):
    h = hashlib.sha1(open(P(f), 'rb').read()).hexdigest()[:8]
    if '%s?v=%s' % (f, h) not in html:
        errors.append('index.html: %s stamp is stale, run python3 tools/stamp.py' % f)

narr = json.loads(read('narration', 'tour.json'))['lines']
ids = [l['id'] for l in narr]
if len(ids) != len(set(ids)):
    errors.append('narration: duplicate ids')
man_p = P('audio', 'tour', 'manifest.json')
man = json.load(open(man_p, encoding='utf-8')) if os.path.exists(man_p) else {}
missing = [i for i in ids if i not in man or not os.path.exists(P('audio', 'tour', i + '.mp3'))]
if missing:
    warnings.append('narration: no audio yet for %s (run the "生成导览配音" workflow)' % ', '.join(missing))
narr_en = json.loads(read('narration', 'tour.en.json'))['lines']
if [l['id'] for l in narr_en] != ids:
    errors.append('narration: tour.en.json ids differ from tour.json')
man_en_p = P('audio', 'tour', 'en', 'manifest.json')
man_en = json.load(open(man_en_p, encoding='utf-8')) if os.path.exists(man_en_p) else {}
missing_en = [i for i in ids if i not in man_en or not os.path.exists(P('audio', 'tour', 'en', i + '.mp3'))]
if missing_en:
    warnings.append('narration: no English audio yet for %d lines (run the "生成导览配音" workflow)' % len(missing_en))
en_before = read('i18n', 'en.js')
r = subprocess.run([sys.executable, P('tools', 'i18n.py'), '--check'], capture_output=True, text=True)
if r.returncode: errors.append(r.stdout.strip())
subprocess.run([sys.executable, P('tools', 'i18n.py')], capture_output=True)
if read('i18n', 'en.js') != en_before:
    errors.append('i18n/en.js was out of date (now regenerated; run tools/stamp.py and commit it)')

js = read('js', 'seafloor.js')
stop_ids = re.findall(r"\{l:'[a-z]+',n:'([a-z0-9_]+)'", js)
for s in stop_ids:
    if s not in ids:
        errors.append('tour stop %s has no narration line' % s)
for s in ('bottom', 'end'):
    if s not in ids:
        errors.append('narration: missing "%s"' % s)

before = {('docs', f): read('docs', f) for f in ('CHANGELOG.md', 'ROADMAP.md', 'SOURCES.md')}
before[('overview.html',)] = read('overview.html')
subprocess.run([sys.executable, P('tools', 'sync_docs.py')], capture_output=True)
for f, old in before.items():
    if read(*f) != old:
        errors.append('%s was out of date with the in-page log (now regenerated; commit it)' % '/'.join(f))

for w in warnings: print('warning:', w)
for e in errors: print('error:', e)
print('%d tour stops, %d narration lines, %d clips' % (len(stop_ids), len(ids), len(man)))
sys.exit(1 if errors else 0)
