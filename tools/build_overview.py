#!/usr/bin/env python3
"""Build overview.html (project overview page for GitHub Pages) and dist/overview-fragment.html (same page for Claude)
from docs/overview.tpl.html, the in-page update log and sources in index.html, and the tables in docs/PROJECT.md."""
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
stats = [(len(fixed), '个地点'), (len(routes), '条下潜路线'), (num(scale['图鉴生物']), '种图鉴生物'), (num(scale['探险任务']), '个探险任务'),
         (len(models), '个物理与生态模型'), (len(sources), '条资料来源'), ('{:,}'.format(n_lines), '行源码')]
STATS = ''.join('<div><b>%s</b><span>%s</span></div>' % (v, esc(k)) for v, k in stats)

# ---- depth chart ---------------------------------------------------------------------------------
def depth_of(name, dstr):
    if '北极' in name: return ('pt', 2.5, '冰下 2–3 m')
    if '潮间带' in name: return ('rng', 0, 5, '0–5 m')
    nums = [float(x.replace(',', '')) for x in re.findall(r'\d[\d,]*\.?\d*', dstr)]
    if '–' in dstr and nums and nums[0] == 0: return ('rng', 0, nums[-1], dstr)
    return ('pt', nums[-1], dstr)
W, H, X0, X1, Y0, Y1 = 900, 780, 150, 890, 30, 750
yd = lambda d: Y0 + (Y1 - Y0) * math.log10(d + 1) / math.log10(11001)
svg = ['<svg viewBox="0 0 %d %d" role="img" aria-label="各地点的水深（对数刻度）">' % (W, H)]
zones = [(0, 200, '透光层', 'z1'), (200, 1000, '暮光层', 'z2'), (1000, 4000, '午夜层', 'z3'), (4000, 6000, '深渊层', 'z4'), (6000, 11000, '超深渊带', 'z5')]
for a, b, lab, c in zones:
    svg.append('<rect class="%s" x="%d" y="%.1f" width="%d" height="%.1f"/>' % (c, X0, yd(a), X1 - X0, yd(b) - yd(a)))
    svg.append('<text class="zl" x="%d" y="%.1f" text-anchor="end">%s · %s–%s m</text>' % (X1 - 8, (yd(a) + yd(b)) / 2 + 4, lab, '{:,}'.format(a), '{:,}'.format(b) if b < 11000 else '10,935'))
for d in [0, 1, 10, 100, 200, 1000, 4000, 6000, 10935]:
    y = yd(d); svg.append('<line x1="%d" x2="%d" y1="%.1f" y2="%.1f" class="lead-line"/>' % (X0 - 6, X0, y, y))
    svg.append('<text class="ax" x="%d" y="%.1f" text-anchor="end">%s m</text>' % (X0 - 10, y + 4, '{:,}'.format(d)))
items = []
bx = X0 + 18
for s in sites:
    k = depth_of(s[0], s[1])
    if k[0] == 'rng':
        svg.append('<rect class="bar" x="%d" y="%.1f" width="5" height="%.1f" rx="2"/>' % (bx, yd(k[1]), yd(k[2]) - yd(k[1])))
        items.append((yd(k[2]), bx + 2.5, s[0], k[3])); bx += 10
    else:
        items.append((yd(k[1]), None, s[0], k[2]))
items.sort()
LX, GAP = 330, 25.5
ys = []
for y, _, _, _ in items:
    ys.append(max(y, (ys[-1] + GAP) if ys else Y0 + 4))
over = ys[-1] - (Y1 - 4)
if over > 0:
    for j in range(len(ys) - 1, -1, -1):
        ys[j] = min(ys[j], Y1 - 4 - (len(ys) - 1 - j) * GAP)
DX = bx + 14
for (y, x, name, dl), ly in zip(items, ys):
    px = x if x is not None else DX
    if x is None: svg.append('<circle class="dot" cx="%d" cy="%.1f" r="4.5"/>' % (px, y))
    svg.append('<path class="lead-line" d="M%.1f %.1f L%d %.1f L%d %.1f"/>' % (px + 5, y, LX - 40, y, LX - 8, ly))
    svg.append('<text x="%d" y="%.1f" font-size="13">%s <tspan class="ax">%s</tspan></text>' % (LX, ly + 4.5, esc(name), esc(dl)))
svg.append('</svg>')
DEPTH_SVG = ''.join(svg)
SITE_ROWS = ''.join('<tr><td>%s</td><td class="num">%s</td><td>%s</td></tr>' % tuple(esc(c) for c in r[:3]) for r in sites)
MODEL_ROWS = ''.join('<tr><td>%s</td><td>%s</td></tr>' % (esc(r[0]), esc(r[1])) for r in models)
tl = lambda L: ''.join('<li><time>%s</time><div><b>%s</b><p>%s</p></div></li>' % (esc(d), esc(t), esc(f[:110] + ('……' if len(f) > 110 else ''))) for t, d, f in L)
SOURCES = ''.join('<li><a href="%s" target="_blank" rel="noopener">%s</a></li>' % (esc(u), esc(t)) for u, t in sources)
dates = sorted(d for _, d, _ in log if d)
rep = {'DATE': dates[-1] if dates else datetime.date.today().isoformat(), 'SITE_URL': SITE_URL, 'REPO_URL': REPO_URL, 'STATS': STATS,
       'N_SITES': str(len(fixed)), 'DEPTH_SVG': DEPTH_SVG, 'SITE_ROWS': SITE_ROWS,
       'MODEL_ROWS': MODEL_ROWS, 'N_SRC': str(n_src_files), 'N_LOG': str(len(log)), 'TIMELINE_TOP': tl(log[:8]), 'N_LOG_MORE': str(max(0, len(log) - 8)),
       'TIMELINE_REST': tl(log[8:]), 'N_SOURCES': str(len(sources)), 'SOURCES': SOURCES}
tpl = R('docs', 'overview.tpl.html')
out = re.sub(r'\{\{(\w+)\}\}', lambda m: rep[m.group(1)], tpl)
os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
open(os.path.join(ROOT, 'dist', 'overview-fragment.html'), 'w', encoding='utf-8').write(out)
cut = out.index('<header')
full = ('<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<meta name="description" content="海底物理世界的项目总览：研究思路、地点与深度、物理模型、技术架构、开发过程、遗留问题、可扩展方向和资料库。">\n'
        '<link rel="icon" href="assets/icon.svg" type="image/svg+xml">\n'
        '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}img{max-width:100%}[hidden]{display:none!important}</style>\n'
        + out[:cut] + '</head>\n<body>\n' + out[cut:] + '</body>\n</html>\n')
full = full.replace('<html lang="zh-CN">', '<html lang="zh-CN">\n<!-- Generated by tools/build_overview.py from docs/overview.tpl.html; do not edit by hand. -->', 1)
open(os.path.join(ROOT, 'overview.html'), 'w', encoding='utf-8').write(full)
print('overview: %d sites, %d routes, %d models, %d log entries, %d sources' % (len(fixed), len(routes), len(models), len(log), len(sources)))
