#!/usr/bin/env python3
"""Generate the exhibition-mode voice-over with the MiniMax text-to-speech API.

Reads narration/tour.json and writes audio/tour/<id>.mp3 plus audio/tour/manifest.json
(duration of each clip and a hash of the text it was made from). Clips whose text,
voice and model are unchanged are skipped, so re-running only pays for edited lines.

Environment variables:
  MINIMAX_API_KEY    required. Keep it in GitHub Secrets; never commit it or put it in the page.
  MINIMAX_API_HOST   optional, default https://api.minimax.cn (China accounts);
                     international accounts use https://api.minimax.io
  MINIMAX_VOICE_ID   optional, default "Chinese (Mandarin)_Male_Announcer"
  MINIMAX_MODEL      optional, default speech-2.8-hd
  MINIMAX_SPEED      optional, default 0.95
Only the Python standard library is used.
"""
import hashlib, json, os, sys, time, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'narration', 'tour.json')
OUT = os.path.join(ROOT, 'audio', 'tour')

key = os.environ.get('MINIMAX_API_KEY', '').strip()
if not key:
    sys.exit('MINIMAX_API_KEY is not set. Add it under the repository Settings > Secrets and variables > Actions.')
host = (os.environ.get('MINIMAX_API_HOST') or 'https://api.minimax.cn').rstrip('/')
voice = os.environ.get('MINIMAX_VOICE_ID') or 'Chinese (Mandarin)_Male_Announcer'
model = os.environ.get('MINIMAX_MODEL') or 'speech-2.8-hd'
speed = float(os.environ.get('MINIMAX_SPEED') or 0.95)

lines = json.load(open(SRC, encoding='utf-8'))['lines']
os.makedirs(OUT, exist_ok=True)
man_path = os.path.join(OUT, 'manifest.json')
manifest = json.load(open(man_path, encoding='utf-8')) if os.path.exists(man_path) else {}


def synth(text):
    body = {
        'model': model, 'text': text, 'stream': False,
        'voice_setting': {'voice_id': voice, 'speed': speed, 'vol': 1, 'pitch': 0},
        'audio_setting': {'sample_rate': 32000, 'bitrate': 128000, 'format': 'mp3', 'channel': 1},
        'language_boost': 'Chinese', 'output_format': 'hex',
    }
    req = urllib.request.Request(host + '/v1/t2a_v2', data=json.dumps(body).encode(),
                                 headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                res = json.loads(r.read())
        except urllib.error.HTTPError as e:
            sys.exit('HTTP %s from %s: %s' % (e.code, host, e.read()[:300]))
        code = (res.get('base_resp') or {}).get('status_code')
        if code == 0 and (res.get('data') or {}).get('audio'):
            return bytes.fromhex(res['data']['audio']), (res.get('extra_info') or {}).get('audio_length')
        msg = (res.get('base_resp') or {}).get('status_msg')
        if code in (1002, 1039):  # rate limited: wait and retry
            time.sleep(5 * (attempt + 1)); continue
        if code == 1004:
            sys.exit('Authentication failed (1004). Check the key, and MINIMAX_API_HOST: China accounts use '
                     'https://api.minimax.cn, international accounts https://api.minimax.io')
        sys.exit('MiniMax error %s: %s' % (code, msg))
    sys.exit('Still rate limited after retries.')


made = 0
for ln in lines:
    sig = hashlib.sha1(json.dumps([ln['text'], voice, model, speed], ensure_ascii=False).encode()).hexdigest()[:12]
    path = os.path.join(OUT, ln['id'] + '.mp3')
    if manifest.get(ln['id'], {}).get('sig') == sig and os.path.exists(path):
        continue
    audio, ms = synth(ln['text'])
    open(path, 'wb').write(audio)
    manifest[ln['id']] = {'sig': sig, 'ms': ms, 'bytes': len(audio)}
    made += 1
    print('made %-14s %5.1f s  %6d bytes' % (ln['id'], (ms or 0) / 1000, len(audio)))

ids = {ln['id'] for ln in lines}
for stale in [k for k in manifest if k not in ids]:
    manifest.pop(stale)
    try: os.remove(os.path.join(OUT, stale + '.mp3'))
    except FileNotFoundError: pass
manifest_out = {'voice': voice, 'model': model, 'clips': {k: manifest[k] for k in sorted(manifest) if k in ids}}
json.dump(manifest_out['clips'], open(man_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('done: %d new or changed clips, %d total (voice %s, model %s)' % (made, len(ids), voice, model))
