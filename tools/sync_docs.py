#!/usr/bin/env python3
"""Regenerate docs/CHANGELOG.md, docs/ROADMAP.md and docs/SOURCES.md from the in-page update log in index.html."""
import html, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
i = s.index('<details id="logDet">'); blk = s[i:s.index('</details>', i)]
def txt(x):
    x = re.sub(r'<b>(.*?)</b>', r'**\1**', x, flags=re.S)
    x = re.sub(r'<a [^>]*href="([^"]+)"[^>]*>(.*?)</a>', r'[\2](\1)', x, flags=re.S)
    return html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', x))).strip()
road, log, src = [], [], []
for d in re.findall(r'<div>\s*(.*?)\s*</div>', blk, re.S):
    h = re.search(r'<h3>(.*?)(?:<time>(.*?)</time>)?</h3>', d, re.S); title, date = txt(h.group(1)), h.group(2)
    items = re.findall(r'<li([^>]*)>(.*?)</li>', d, re.S)
    if title.startswith('路线图'):
        for a, t in items:
            road.append(('- [x] ' if 'done' in a else '- [ ] ') + txt(t) + (' （下一步）' if 'next' in a else ''))
    elif title == '资料来源':
        src = ['- ' + txt(t) for a, t in items]
    else:
        log.append('## ' + title + (' · ' + date if date else '') + '\n\n' + '\n'.join('- ' + txt(t) for a, t in items))
w = lambda n, c: open(os.path.join(ROOT, 'docs', n), 'w', encoding='utf-8').write(c)
w('CHANGELOG.md', '# 更新记录\n\n由页面内“更新记录、路线图与资料来源”整理而来，最新的在最上面。\n\n' + '\n\n'.join(log) + '\n')
w('ROADMAP.md', '# 路线图\n\n功能按顺序逐项加入，每项完成后在页面和这里同步记录。\n\n' + '\n'.join(road) + '\n')
w('SOURCES.md', '# 资料来源\n\n页面中的物理参数、地点和生物资料引用自以下来源（共 %d 条）。\n\n' % len(src) + '\n'.join(src) + '\n')
print('changelog %d, roadmap %d, sources %d' % (len(log), len(road), len(src)))
