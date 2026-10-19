#!/usr/bin/env python3
"""Browser smoke test: serves the repo locally, opens it in headless Chromium and exercises the
main features (scene loads, tour with narration, map with on-demand data, postcard, VR, piloting).

    pip install playwright && python3 -m playwright install chromium
    python3 tools/smoke_test.py [--three-dir PATH_TO_LOCAL_THREEJS_CHECKOUT] [--shots DIR]

--three-dir serves three.js from a local checkout instead of the CDN (for offline machines).
Exits non-zero if a page error occurs or a check fails.
"""
import argparse, asyncio, functools, http.server, json, os, sys, threading
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument('--three-dir'); ap.add_argument('--shots'); ap.add_argument('--port', type=int, default=8791); ap.add_argument('--lang', default='zh')
args = ap.parse_args()

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', args.port), functools.partial(Quiet, directory=ROOT))
threading.Thread(target=srv.serve_forever, daemon=True).start()

CHECKS = [
    ('scene', '''async()=>{await new Promise(r=>setTimeout(r,2500));return {ok:!!document.querySelector('#gl')&&document.getElementById('err').hidden,
        depth:document.getElementById('hDepth').textContent}}'''),
    ('tour+narration', '''async()=>{document.getElementById('welTour').click();await new Promise(r=>setTimeout(r,4000));
        const v=document.getElementById('tourVoice');const out={stop:document.getElementById('tourN').textContent,voice:v.textContent,starts:window.__starts.slice()};
        document.getElementById('tourNext').click();await new Promise(r=>setTimeout(r,3000));out.starts2=window.__starts.slice();
        document.getElementById('tourX').click();
        const man=await fetch('audio/tour/manifest.json').then(r=>r.json()).catch(()=>({}));
        const lines=(await fetch('narration/tour.json').then(r=>r.json())).lines.filter(l=>/^s\d/.test(l.id));const nextHasClip=!!man[lines[1].id];
        out.ok=out.starts.length>=2&&!v.hidden&&(out.starts2.length>out.starts.length||!nextHasClip);return out}'''),
    ('map', '''async()=>{const pre=!!window.ETOPO_B64;document.getElementById('mapOpen').click();await new Promise(r=>setTimeout(r,3500));
        const c=document.getElementById('mapCv'),px=c.getContext('2d').getImageData(c.width/2|0,c.height/2|0,1,1).data;document.getElementById('mapX').click();
        return {ok:!pre&&!!window.ETOPO_B64&&px[3]>0,preloaded:pre}}'''),
    ('postcard', '''async()=>{document.getElementById('cardBtn').click();await new Promise(r=>setTimeout(r,2500));
        const img=document.getElementById('cardImg');const ok=!document.getElementById('card').hidden&&img.naturalWidth===1600;document.getElementById('card').hidden=true;return {ok,w:img.naturalWidth}}'''),
    ('vr', '''async()=>{document.getElementById('vrSplit').click();await new Promise(r=>setTimeout(r,1500));const on=document.body.classList.contains('vr');
        document.getElementById('vrX').click();await new Promise(r=>setTimeout(r,500));return {ok:on&&!document.body.classList.contains('vr')}}'''),
    ('pilot', '''async()=>{document.getElementById('pilotBtn').click();await new Promise(r=>setTimeout(r,1000));const on=!document.getElementById('pilotBar').hidden;
        document.getElementById('pilotX').click();return {ok:on&&document.getElementById('pilotBar').hidden}}'''),
]

async def main():
    fails = 0
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 760}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        if args.three_dir:
            async def route(r):
                u = r.request.url
                if 'three.min.js' in u: await r.fulfill(path=os.path.join(args.three_dir, 'build/three.min.js'), content_type='application/javascript')
                elif '/examples/js/' in u: await r.fulfill(path=os.path.join(args.three_dir, 'examples/js', u.split('/examples/js/')[1]), content_type='application/javascript')
                elif 'fonts.g' in u: await r.abort()
                else: await r.continue_()
            await pg.route('**/*', route)
        await pg.add_init_script('window.__starts=[];const o=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...a){window.__starts.push(this.buffer?+this.buffer.duration.toFixed(1):0);return o.apply(this,a)}')
        await pg.goto('http://127.0.0.1:%d/?lang=%s' % (args.port, args.lang)); await pg.wait_for_timeout(1500)
        await pg.evaluate("()=>{const w=document.getElementById('welcome');if(w)w.hidden=true}")
        for name, js in CHECKS:
            try: r = await pg.evaluate(js)
            except Exception as e: r = {'ok': False, 'error': str(e)[:200]}
            fails += not r.get('ok'); print('%-16s %s  %s' % (name, 'OK  ' if r.get('ok') else 'FAIL', json.dumps(r, ensure_ascii=False)))
            if args.shots: os.makedirs(args.shots, exist_ok=True); await pg.screenshot(path=os.path.join(args.shots, name + '.png'))
        for e in errs: print('page error:', e)
        await b.close()
    srv.shutdown()
    sys.exit(1 if fails or errs else 0)
asyncio.run(main())
