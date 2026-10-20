#!/usr/bin/env python3
"""Fetch today's real-world ocean data and write data/live.json for the page.

Run daily by .github/workflows/live.yml. Sources (all public, no key):
  - NOAA Coral Reef Watch 5-km regional virtual stations: sea surface temperature, HotSpot,
    Degree Heating Weeks and bleaching alert for the Paracel Islands, Hainan Island and the Gulf of Aqaba
    (the whole daily record since 1985 also goes to data/reef_history.json for the time machine)
  - Open-Meteo marine API: today's wave height, wave period and sea surface temperature at four sites
  - Open-Meteo marine API (Meteo-France SMOC model): hourly sea level including tides off the Nanji Islands
  - NSIDC Sea Ice Index v4: daily Arctic and Antarctic sea-ice extent and the 1981-2010 daily climatology

Each source is independent: if one fails, its previous value in data/live.json is kept and the error is recorded.
For offline testing set LIVE_FIXTURES=DIR; files are then read from DIR/<basename of the URL> instead of the network.

usage: python3 tools/fetch_live.py [--out data/live.json]
"""
import datetime as dt, json, os, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else os.path.join(ROOT, 'data', 'live.json')
FIX = os.environ.get('LIVE_FIXTURES')

CRW = 'https://coralreefwatch.noaa.gov/product/vs/data/%s.txt'
REEFS = {  # scene id -> CRW station file
    'xisha': 'paracel_islands',
    'spawn': 'hainan_island',
    'eilat': 'gulf_of_aqaba',
}
TIDE_URL = ('https://marine-api.open-meteo.com/v1/marine?latitude=27.45&longitude=121.12'
            '&hourly=sea_level_height_msl&past_days=1&forecast_days=4&timezone=GMT&cell_selection=sea')
# today's sea state (wave height and period, sea surface temperature), hourly from the same marine API
SEA_URL = ('https://marine-api.open-meteo.com/v1/marine?latitude=%s&longitude=%s'
           '&hourly=wave_height,wave_period,sea_surface_temperature&past_days=1&forecast_days=4&timezone=GMT&cell_selection=sea')
SEA = {'monterey': (36.62, -121.90), 'xisha': (16.5, 111.6), 'eilat': (29.5, 34.95), 'nanji': (27.45, 121.12)}
HIST_OUT = os.path.join(os.path.dirname(OUT), 'reef_history.json')
NSIDC = 'https://noaadata.apps.nsidc.org/NOAA/G02135/%s/daily/data/%s_seaice_extent_%s_v4.0.csv'


def get(url):
    if FIX:
        name = url.split('?')[0].rsplit('/', 1)[-1] or 'marine'
        if 'open-meteo' in url:
            name = 'marine_sea.json' if 'wave_height' in url else 'marine.json'
        with open(os.path.join(FIX, name), encoding='utf-8') as f:
            return f.read()
    req = urllib.request.Request(url, headers={'User-Agent': 'seafloor-world (github.com/bluesky-rgb/seafloor-world-new)'})
    with urllib.request.urlopen(req, timeout=90) as r:
        return r.read().decode('utf-8', 'replace')


# ---- coral heat stress ------------------------------------------------------------------------------------
def alert_level(hs, dhw):
    """NOAA CRW Bleaching Alert Area, with the Alert Levels 3-5 added in 2023 (DHW 12/16/20):
    0 no stress, 1 watch, 2 warning, 3-7 alert levels 1-5"""
    if hs <= 0:
        return 0
    if hs < 1:
        return 1
    for lvl, lim in ((2, 4), (3, 8), (4, 12), (5, 16), (6, 20)):
        if dhw < lim:
            return lvl
    return 7


def reef(station):
    lines = get(CRW % station).splitlines()
    head = [l.strip() for l in lines[:24]]
    name = head[1]
    mmm = float(head[head.index('Averaged Maximum Monthly Mean:') + 1])
    monthly = [float(v) for v in head[head.index('Averaged Monthly Mean (Jan-Dec):') + 1].split()]
    lat = float(head[head.index('Polygon Middle Latitude:') + 1])
    lon = float(head[head.index('Polygon Middle Longitude:') + 1])
    rows = []
    for l in lines:
        p = l.split()
        if len(p) >= 10 and p[0].isdigit() and len(p[0]) == 4:
            y, m, d = int(p[0]), int(p[1]), int(p[2])
            rows.append((dt.date(y, m, d), float(p[3]), float(p[4]), float(p[5]), float(p[6]), float(p[7]), float(p[8]), int(float(p[9]))))
    if not rows:
        raise ValueError('no data rows')
    last = rows[-1]
    # row: (date, SST_MIN, SST_MAX, SST@90th_HS, SSTA, HotSpot, DHW, BAA)
    lv = [alert_level(r[5], r[6]) for r in rows]
    level = max(lv[-7:])                          # like CRW's 7-day-maximum alert
    year = [r for r in rows if (last[0] - r[0]).days < 365]
    peak = max(year, key=lambda r: r[6])
    # strongest heat stress on record, one entry per year (top 3)
    best = {}
    for r in rows:
        if r[6] > best.get(r[0].year, (None, -1))[1]:
            best[r[0].year] = (r[0], r[6])
    top = sorted(best.values(), key=lambda v: -v[1])[:5]
    # the whole record, one value per day from the first date (null where a day is missing), in tenths
    start = rows[0][0]
    n = (last[0] - start).days + 1
    sst, hs, dhw = [None] * n, [None] * n, [None] * n
    for r in rows:
        i = (r[0] - start).days
        sst[i], hs[i], dhw[i] = round(r[3] * 10), round(r[5] * 10), round(r[6] * 10)
    hist = {'station': name, 'start': start.isoformat(), 'mmm': round(mmm, 2), 'threshold': round(mmm + 1, 2),
            'events': [{'date': d.isoformat(), 'dhw': round(v, 2)} for d, v in top if v > 0],
            'sst10': sst, 'hs10': hs, 'dhw10': dhw}
    return hist, {
        'station': name, 'file': station, 'lat': lat, 'lon': lon,
        'date': last[0].isoformat(),
        'sstMin': last[1], 'sstMax': last[2], 'sst': last[3], 'ssta': round(last[4], 2),
        'hotspot': round(last[5], 2), 'dhw': round(last[6], 2), 'level': level, 'baa': last[7],
        'mmm': round(mmm, 2), 'threshold': round(mmm + 1, 2), 'monthly': [round(v, 2) for v in monthly],
        'peak365': {'date': peak[0].isoformat(), 'dhw': round(peak[6], 2)},
        'record': [{'date': d.isoformat(), 'dhw': round(v, 2)} for d, v in top[:3] if v > 0],
        # past year, daily: [days before the last date, SST at the 90th-percentile HotSpot pixel, DHW]
        'series': [[(last[0] - r[0]).days, round(r[3], 2), round(r[6], 2)] for r in year],
    }


# ---- sea state ---------------------------------------------------------------------------------------------------
def sea(lat, lon):
    j = json.loads(get(SEA_URL % (lat, lon)))
    h = j['hourly']
    t0 = dt.datetime.fromisoformat(h['time'][0]).replace(tzinfo=dt.timezone.utc)
    rnd = lambda a, n: [None if v is None else round(v, n) for v in a]
    if sum(v is not None for v in h['wave_height']) < 24:
        raise ValueError('too few wave values')
    return {'lat': j.get('latitude'), 'lon': j.get('longitude'), 't0': int(t0.timestamp()), 'step': 3600,
            'H': rnd(h['wave_height'], 2), 'T': rnd(h['wave_period'], 1), 'sst': rnd(h.get('sea_surface_temperature') or [], 1)}


# ---- tide off the Nanji Islands -----------------------------------------------------------------------------
def tide():
    j = json.loads(get(TIDE_URL))
    t = j['hourly']['time']
    h = j['hourly']['sea_level_height_msl']
    pts = [(x, v) for x, v in zip(t, h) if v is not None]
    if len(pts) < 24:
        raise ValueError('too few sea-level values')
    t0 = dt.datetime.fromisoformat(pts[0][0]).replace(tzinfo=dt.timezone.utc)
    mean = sum(v for _, v in pts) / len(pts)
    return {
        'site': 'nanji', 'lat': j.get('latitude'), 'lon': j.get('longitude'),
        'model': 'Meteo-France SMOC (via Open-Meteo)',
        't0': int(t0.timestamp()), 'step': 3600,
        # hourly height above the local mean of this window (m); gaps (if any) are filled by the page
        'h': [round(v - mean, 3) for _, v in pts],
    }


# ---- sea-ice extent -------------------------------------------------------------------------------------------
def csv_rows(text):
    out = []
    for l in text.splitlines():
        p = [c.strip() for c in l.split(',')]
        if p and p[0].isdigit():
            out.append(p)
    return out


def ice(hemi):
    H = hemi[0].upper()
    daily = csv_rows(get(NSIDC % (hemi, H, 'daily')))
    # climatology row: DOY, average, std dev, 10th, 25th, 50th, 75th, 90th percentile -> [avg, sd, p10, p25, p50, p75, p90]
    clim = {int(p[0]): [float(v) for v in p[1:8]] for p in csv_rows(get(NSIDC % (hemi, H, 'climatology_1981-2010')))}
    ext = {}
    for p in daily:
        try:
            ext[dt.date(int(p[0]), int(p[1]), int(p[2]))] = float(p[3])
        except (ValueError, IndexError):
            pass
    last = max(ext)
    doy = min(last.timetuple().tm_yday, 365)
    c = clim.get(doy) or clim[min(clim, key=lambda k: abs(k - doy))]
    same = {}
    for d, v in ext.items():                       # each year's value on this calendar day (or the nearest day within 1)
        if d.year == last.year:
            continue
        for k in (0, -1, 1):
            try:
                dd = dt.date(d.year, last.month, last.day) + dt.timedelta(days=k)
            except ValueError:
                continue
            if d == dd and d.year not in same:
                same[d.year] = v
    rank = 1 + sum(1 for v in same.values() if v < ext[last])
    year = sorted((d, v) for d, v in ext.items() if (last - d).days < 366)
    def cl(d):
        q = clim.get(min(d.timetuple().tm_yday, 365))
        return q or c
    return {
        'date': last.isoformat(), 'extent': round(ext[last], 3),
        'climAvg': round(c[0], 3), 'climMedian': round(c[4], 3), 'clim10': round(c[2], 3), 'clim90': round(c[6], 3),
        'rankLow': rank, 'years': len(same) + 1, 'firstYear': min(same) if same else last.year,
        'yearMin': {'date': min(year, key=lambda x: x[1])[0].isoformat(), 'extent': round(min(v for _, v in year), 3)},
        # past year, daily: [days before the last date, extent, 1981-2010 median, 10th, 90th percentile]
        'series': [[(last - d).days, round(v, 3), round(cl(d)[4], 3), round(cl(d)[2], 3), round(cl(d)[6], 3)] for d, v in year],
    }


def main():
    try:
        with open(OUT, encoding='utf-8') as f:
            old = json.load(f)
    except (OSError, ValueError):
        old = {}
    out = {'updated': dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z'),
           'coral': dict(old.get('coral', {})), 'tide': old.get('tide'), 'ice': dict(old.get('ice', {})),
           'sea': dict(old.get('sea', {})), 'errors': []}
    try:
        with open(HIST_OUT, encoding='utf-8') as f:
            hist = json.load(f)
    except (OSError, ValueError):
        hist = {'reefs': {}}
    for sid, st in REEFS.items():
        try:
            hist['reefs'][sid], out['coral'][sid] = reef(st)
        except Exception as e:  # keep the previous value
            out['errors'].append('coral %s: %s' % (st, e))
    for sid, (lat, lon) in SEA.items():
        try:
            out['sea'][sid] = sea(lat, lon)
        except Exception as e:
            out['errors'].append('sea %s: %s' % (sid, e))
    try:
        out['tide'] = tide()
    except Exception as e:
        out['errors'].append('tide: %s' % e)
    for hemi in ('north', 'south'):
        try:
            out['ice'][hemi] = ice(hemi)
        except Exception as e:
            out['errors'].append('ice %s: %s' % (hemi, e))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
        f.write('\n')
    hist['updated'] = out['updated']
    with open(HIST_OUT, 'w', encoding='utf-8') as f:
        json.dump(hist, f, ensure_ascii=False, separators=(',', ':'))
        f.write('\n')
    for e in out['errors']:
        print('error:', e)
    total = len(REEFS) + len(SEA) + 3
    ok = total - len(out['errors'])
    print('live data: %d of %d sources updated -> %s, %s' % (ok, total, os.path.relpath(OUT, ROOT), os.path.relpath(HIST_OUT, ROOT)))
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
