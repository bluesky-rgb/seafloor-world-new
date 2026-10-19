#!/usr/bin/env python3
"""Build overview.html and overview.en.html (project overview pages for GitHub Pages) and dist/overview-fragment.html
(the Chinese page for Claude) from docs/overview.tpl.html / overview.en.tpl.html, the in-page update log and sources in index.html, and the tables in docs/PROJECT.md."""
import html, math, os, re, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = lambda *p: open(os.path.join(ROOT, *p), encoding='utf-8').read()
SITE_URL = 'https://bluesky-rgb.github.io/seafloor-world-new/'
REPO_URL = 'https://github.com/bluesky-rgb/seafloor-world-new'
esc = html.escape

def strip(x):
    return html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', x))).strip()

# ---- in-page log: entries, sources --------------------------------------------------------------
page = R('index.html')
i = page.index('<details id="logDet">'); blk = page[i:page.index('</details>', i)]
log, sources = [], []
for d in re.findall(r'<div>\s*(.*?)\s*</div>', blk, re.S):
    h = re.search(r'<h3>(.*?)(?:<time>(.*?)</time>)?</h3>', d, re.S)
    title, date = strip(h.group(1)), h.group(2) or ''
    items = re.findall(r'<li([^>]*)>(.*?)</li>', d, re.S)
    if title.startswith('路线图'):
        continue
    if title == '资料来源':
        for a, t in items:
            m = re.search(r'href="([^"]+)"', t)
            sources.append((m.group(1) if m else '', strip(t)))
    else:
        first = strip(items[0][1]) if items else ''
        log.append((title, date, first))

# ---- PROJECT.md tables ----------------------------------------------------------------------------
proj = R('docs', 'PROJECT.md')
def table(after):
    """rows of the first markdown table after the heading `after` (header and divider rows dropped)"""
    block = proj[proj.index(after):].split('\n\n')[1]
    return [[c.strip() for c in l.strip('|').split('|')] for l in block.split('\n') if l.startswith('|')][2:]
scale = {r[0]: r[1] for r in table('## 现在的规模')}
sites = table('## 场景一览')
models = table('## 用到的物理与生态模型')
n_src_files = len([f for f in os.listdir(os.path.join(ROOT, 'src')) if f.endswith('.js')])
n_lines = sum(len(R('src', f).split('\n')) for f in os.listdir(os.path.join(ROOT, 'src')) if f.endswith('.js'))
num = lambda s: int(re.search(r'\d+', s.replace(',', '')).group())

routes = [s for s in sites if '→' in s[0] or '重走' in s[0]]
fixed = [s for s in sites if s not in routes]
# ---- depth chart ---------------------------------------------------------------------------------
def depth_of(name, dstr):
    if '北极' in name: return ('pt', 2.5, '冰下 2–3 m')
    if '潮间带' in name: return ('rng', 0, 5, '0–5 m')
    nums = [float(x.replace(',', '')) for x in re.findall(r'\d[\d,]*\.?\d*', dstr)]
    if '–' in dstr and nums and nums[0] == 0: return ('rng', 0, nums[-1], dstr)
    return ('pt', nums[-1], dstr)
W, H, X0, X1, Y0, Y1 = 900, 780, 150, 890, 30, 750
yd = lambda d: Y0 + (Y1 - Y0) * math.log10(d + 1) / math.log10(11001)
import json, sys
EN = json.load(open(os.path.join(ROOT, 'i18n', 'en.json'), encoding='utf-8'))
# strings that appear only on the overview (PROJECT.md tables, update-log titles, source notes)
EN.update(json.load(open(os.path.join(ROOT, 'i18n', 'overview.en.json'), encoding='utf-8')))
CJK = re.compile(r'[\u3000-\u303f\u4e00-\u9fff\uff00-\uffef]')
MISSING = []

def render(lang):
    """lang 'zh' renders the Chinese source text; 'en' looks each string up in i18n/en.json (missing ones are reported)"""
    def tr(x):
        if lang == 'zh' or not x or not CJK.search(x): return x
        v = EN.get(x)
        if v is None: MISSING.append(x); return x
        return v
    L = (lambda zh, en: en) if lang == 'en' else (lambda zh, en: zh)
    stats = [(len(fixed), L('个地点', 'places')), (len(routes), L('条下潜路线', 'dive routes')), (num(scale['图鉴生物']), L('种图鉴生物', 'species in the field guide')),
             (num(scale['探险任务']), L('个探险任务', 'expeditions')), (len(models), L('个物理与生态模型', 'physical and ecological models')),
             (len(sources), L('条资料来源', 'sources')), ('{:,}'.format(n_lines), L('行源码', 'lines of code'))]
    STATS = ''.join('<div><b>%s</b><span>%s</span></div>' % (v, esc(k)) for v, k in stats)
    svg = ['<svg viewBox="0 0 %d %d" role="img" aria-label="%s">' % (W, H, L('各地点的水深（对数刻度）', 'Depth of each place (log scale)'))]
    zones = [(0, 200, L('透光层', 'Sunlight zone'), 'z1'), (200, 1000, L('暮光层', 'Twilight zone'), 'z2'), (1000, 4000, L('午夜层', 'Midnight zone'), 'z3'),
             (4000, 6000, L('深渊层', 'Abyssal zone'), 'z4'), (6000, 11000, L('超深渊带', 'Hadal zone'), 'z5')]
    for a, b, lab, c in zones:
        svg.append('<rect class="%s" x="%d" y="%.1f" width="%d" height="%.1f"/>' % (c, X0, yd(a), X1 - X0, yd(b) - yd(a)))
        svg.append('<text class="zl" x="%d" y="%.1f" text-anchor="end">%s · %s–%s m</text>' % (X1 - 8, (yd(a) + yd(b)) / 2 + 4, lab, '{:,}'.format(a), '{:,}'.format(b) if b < 11000 else '10,935'))
    for d in [0, 1, 10, 100, 200, 1000, 4000, 6000, 10935]:
        y = yd(d); svg.append('<line x1="%d" x2="%d" y1="%.1f" y2="%.1f" class="lead-line"/>' % (X0 - 6, X0, y, y))
        svg.append('<text class="ax" x="%d" y="%.1f" text-anchor="end">%s m</text>' % (X0 - 10, y + 4, '{:,}'.format(d)))
    items = []; bx = X0 + 18
    for st in sites:
        k = depth_of(st[0], st[1])
        if k[0] == 'rng':
            svg.append('<rect class="bar" x="%d" y="%.1f" width="5" height="%.1f" rx="2"/>' % (bx, yd(k[1]), yd(k[2]) - yd(k[1])))
            items.append((yd(k[2]), bx + 2.5, tr(st[0]), tr(k[3]))); bx += 10
        else:
            items.append((yd(k[1]), None, tr(st[0]), tr(k[2])))
    items.sort()
    LX, GAP = 330, 25.5
    ys = []
    for y, _, _, _ in items: ys.append(max(y, (ys[-1] + GAP) if ys else Y0 + 4))
    if ys[-1] > Y1 - 4:
        for j in range(len(ys) - 1, -1, -1): ys[j] = min(ys[j], Y1 - 4 - (len(ys) - 1 - j) * GAP)
    DX = bx + 14
    for (y, x, name, dl), ly in zip(items, ys):
        px = x if x is not None else DX
        if x is None: svg.append('<circle class="dot" cx="%d" cy="%.1f" r="4.5"/>' % (px, y))
        svg.append('<path class="lead-line" d="M%.1f %.1f L%d %.1f L%d %.1f"/>' % (px + 5, y, LX - 40, y, LX - 8, ly))
        svg.append('<text x="%d" y="%.1f" font-size="13">%s <tspan class="ax">%s</tspan></text>' % (LX, ly + 4.5, esc(name), esc(dl)))
    svg.append('</svg>')
    SITE_ROWS = ''.join('<tr><td>%s</td><td class="num">%s</td><td>%s</td></tr>' % tuple(esc(tr(c)) for c in r[:3]) for r in sites)
    MODEL_ROWS = ''.join('<tr><td>%s</td><td>%s</td></tr>' % (esc(tr(r[0])), esc(tr(r[1]))) for r in models)
    if lang == 'en':
        tl = lambda Lg: ''.join('<li><time>%s</time><div><b>%s</b></div></li>' % (esc(d), esc(tr(t))) for t, d, f in Lg)
    else:
        tl = lambda Lg: ''.join('<li><time>%s</time><div><b>%s</b><p>%s</p></div></li>' % (esc(d), esc(t), esc(f[:110] + ('……' if len(f) > 110 else ''))) for t, d, f in Lg)
    SOURCES = ''.join('<li><a href="%s" target="_blank" rel="noopener">%s</a></li>' % (esc(u), esc(tr(t))) for u, t in sources)
    dates = sorted(d for _, d, _ in log if d)
    rep = {'DATE': dates[-1] if dates else datetime.date.today().isoformat(), 'SITE_URL': SITE_URL, 'REPO_URL': REPO_URL, 'STATS': STATS,
           'N_SITES': str(len(fixed)), 'DEPTH_SVG': ''.join(svg), 'SITE_ROWS': SITE_ROWS,
           'MODEL_ROWS': MODEL_ROWS, 'N_SRC': str(n_src_files), 'N_LOG': str(len(log)), 'TIMELINE_TOP': tl(log[:8]), 'N_LOG_MORE': str(max(0, len(log) - 8)),
           'TIMELINE_REST': tl(log[8:]), 'N_SOURCES': str(len(sources)), 'SOURCES': SOURCES}
    tpl = R('docs', 'overview.tpl.html' if lang == 'zh' else 'overview.en.tpl.html')
    out = re.sub(r'\{\{(\w+)\}\}', lambda m: rep[m.group(1)], tpl)
    cut = out.index('<header')
    desc = L('海底物理世界的项目总览：研究思路、地点与深度、物理模型、技术架构、开发过程、遗留问题、可扩展方向和资料库。',
             'Seafloor Physics World project overview: research approach, places and depths, physical models, architecture, development, open issues, ideas and sources.')
    hl = L('zh-CN', 'en')
    full = ('<!doctype html>\n<html lang="%s">\n<!-- Generated by tools/build_overview.py from docs/%s; do not edit by hand. -->\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="description" content="%s">\n'
            '<link rel="icon" href="assets/icon.svg" type="image/svg+xml">\n'
            '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}img{max-width:100%%}[hidden]{display:none!important}</style>\n'
            % (hl, 'overview.tpl.html' if lang == 'zh' else 'overview.en.tpl.html', desc) + out[:cut] + '</head>\n<body>\n' + out[cut:] + '</body>\n</html>\n')
    return out, full

os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
for lang, name in (('zh', 'overview.html'), ('en', 'overview.en.html')):
    frag, full = render(lang)
    open(os.path.join(ROOT, name), 'w', encoding='utf-8').write(full)
    if lang == 'zh': open(os.path.join(ROOT, 'dist', 'overview-fragment.html'), 'w', encoding='utf-8').write(frag)
miss = sorted(set(MISSING))
if '--missing' in sys.argv: print(json.dumps(miss, ensure_ascii=False, indent=0)); sys.exit(0)
if miss: print('overview: %d strings have no English translation (python3 tools/build_overview.py --missing)' % len(miss))
print('overview: %d sites, %d routes, %d models, %d log entries, %d sources' % (len(fixed), len(routes), len(models), len(log), len(sources)))
