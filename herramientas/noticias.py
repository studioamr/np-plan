#!/usr/bin/env python3
"""Guarda en data/noticias.json los titulares más recientes (con foto) de fuentes financieras en español.
La página overview.html usa este archivo para cargar al instante y luego pide las noticias en vivo.
Uso: python3 herramientas/noticias.py   (sin dependencias)"""
import json, re, urllib.request, email.utils, html, datetime, pathlib
import xml.etree.ElementTree as ET

FUENTES = [
  ("mercados", "El Financiero", "https://www.elfinanciero.com.mx/arc/outboundfeeds/rss/category/mercados/?outputType=xml"),
  ("mercados", "Bloomberg Línea", "https://www.bloomberglinea.com/arc/outboundfeeds/rss/category/mercados/?outputType=xml"),
  ("mercados", "Expansión", "https://expansion.mx/rss/mercados"),
  ("economia", "Expansión", "https://expansion.mx/rss/economia"),
  ("ia", "Bloomberg Línea", "https://www.bloomberglinea.com/arc/outboundfeeds/rss/category/tecnologia/?outputType=xml"),
  ("ia", "Expansión", "https://expansion.mx/rss/tecnologia"),
]
MEDIA = "{http://search.yahoo.com/mrss/}"

def foto(it):
    for tag in (MEDIA+"content", MEDIA+"thumbnail", "enclosure"):
        for e in it.iter(tag):
            u = e.get("url")
            if u and (e.get("medium") in (None, "image") or re.search(r"\.(jpe?g|png|webp)", u, re.I) or "type" not in e.attrib or e.get("type","").startswith("image")):
                return u
    m = re.search(r'<img[^>]+src="([^"]+)"', (it.findtext("description") or "") + (it.findtext("{http://purl.org/rss/1.0/modules/content/}encoded") or ""))
    return m.group(1) if m else ""

def leer(cat, fuente, url, n=12):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (NORTHPOINT Ideas)"})
    raiz = ET.fromstring(urllib.request.urlopen(req, timeout=20).read())
    out = []
    for it in raiz.iter("item"):
        t = html.unescape((it.findtext("title") or "").strip()); l = (it.findtext("link") or "").strip(); img = foto(it)
        if not (t and l and img): continue
        try: f = email.utils.parsedate_to_datetime(it.findtext("pubDate")).astimezone(datetime.timezone.utc).isoformat()
        except Exception: f = ""
        out.append({"cat": cat, "fuente": fuente, "t": t, "l": l, "img": img, "f": f})
        if len(out) >= n: break
    return out

if __name__ == "__main__":
    todo, vistos = [], set()
    for cat, fuente, url in FUENTES:
        try:
            for x in leer(cat, fuente, url):
                if x["l"] in vistos: continue
                vistos.add(x["l"]); todo.append(x)
        except Exception as e:
            print("sin respuesta:", fuente, cat, e)
    todo.sort(key=lambda x: x["f"], reverse=True)
    dest = pathlib.Path(__file__).resolve().parent.parent / "data" / "noticias.json"
    dest.write_text(json.dumps({"actualizado": datetime.datetime.now(datetime.timezone.utc).isoformat(), "items": todo}, ensure_ascii=False, indent=1))
    print(len(todo), "noticias →", dest)

# ── memos reales de northpointcapital.io/memos.html → data/memos.json (la página también los lee en vivo) ──
def memos():
    base = "https://northpointcapital.io/"
    get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=20).read().decode("utf-8", "ignore")
    t = get(base + "memos.html"); out = []
    for m in re.finditer(r'<a class="ix memo" href="([^"]+)">(.*?)</a>', t, re.S):
        href, b = m.group(1), m.group(2)
        g = lambda cls: html.unescape(re.sub(r"<[^>]+>", "", (re.search(r'class="%s"[^>]*>(.*?)</(?:span|p)>' % cls, b, re.S) or [None, ""])[1])).strip()
        url = base + href; img = ""; main = ""
        try:
            p = get(url); im = re.search(r'src="([^"]*assets/images/memos/[^"]+)"', p)
            if im: img = urllib.parse.urljoin(url, im.group(1))
            mm = re.search(r"<main.*?</main>", p, re.S); main = mm.group(0) if mm else ""
        except Exception: pass
        out.append({"k": g("memo-k"), "t": g("nm"), "f": g("fr"), "r": g("memo-s"), "a": g("memo-a"), "l": url, "img": img, "main": main})
    return out

if __name__ == "__main__":
    import urllib.parse
    try:
        ms = memos(); (pathlib.Path(__file__).resolve().parent.parent / "data" / "memos.json").write_text(json.dumps({"items": ms}, ensure_ascii=False, indent=1)); print(len(ms), "memos")
    except Exception as e: print("memos sin respuesta:", e)

# ── calendario económico de la semana (ForexFactory) → data/calendario.json ──
# ── últimos videos de canales financieros (YouTube) → data/videos.json ──
CANALES = [("Bloomberg Línea", "UCt4iMhUHxnKfxJXIW36Y4Rw"), ("El Economista", "UCXmAOGwFYxIq5qrScJeeV4g")]
if __name__ == "__main__":
    base = pathlib.Path(__file__).resolve().parent.parent / "data"
    try:
        cal = json.loads(urllib.request.urlopen(urllib.request.Request("https://nfs.faireconomy.media/ff_calendar_thisweek.json", headers={"User-Agent": "Mozilla/5.0"}), timeout=20).read())
        (base / "calendario.json").write_text(json.dumps({"actualizado": datetime.datetime.now(datetime.timezone.utc).isoformat(), "items": cal}, ensure_ascii=False)); print(len(cal), "eventos")
    except Exception as e: print("calendario sin respuesta:", e)
    vids = []
    for nombre, cid in CANALES:
        try:
            t = urllib.request.urlopen(urllib.request.Request("https://www.youtube.com/feeds/videos.xml?channel_id=" + cid, headers={"User-Agent": "Mozilla/5.0"}), timeout=20).read().decode("utf-8", "ignore")
            for e in re.findall(r"<entry>(.*?)</entry>", t, re.S)[:8]:
                vid = re.search(r"<yt:videoId>(.*?)</yt:videoId>", e).group(1)
                vids.append({"canal": nombre, "id": vid, "t": html.unescape(re.search(r"<title>(.*?)</title>", e).group(1)), "f": re.search(r"<published>(.*?)</published>", e).group(1)})
        except Exception as ex: print("videos sin respuesta:", nombre, ex)
    vids.sort(key=lambda v: v["f"], reverse=True)
    (base / "videos.json").write_text(json.dumps({"items": vids}, ensure_ascii=False, indent=1)); print(len(vids), "videos")

# ── Polymarket: mercados de predicción de economía, Fed, cripto, petróleo e IA → data/polymarket.json ──
TEMAS = {"Economy", "Fed", "fomc", "Finance", "Crypto", "Bitcoin", "Ethereum", "AI", "Oil", "Geopolitics", "Inflation", "Recession"}
if __name__ == "__main__":
    try:
        evs = json.loads(urllib.request.urlopen(urllib.request.Request("https://gamma-api.polymarket.com/events?active=true&closed=false&limit=150&order=volume24hr&ascending=false", headers={"User-Agent": "Mozilla/5.0"}), timeout=25).read())
        out = []
        for e in evs:
            tags = {t.get("label") for t in e.get("tags", [])}
            if not (tags & TEMAS) or "Sports" in tags: continue
            ms = []
            for m in e.get("markets", []):
                if m.get("closed") or not m.get("active") or not m.get("outcomePrices"): continue
                try: p = float(json.loads(m["outcomePrices"])[0])
                except Exception: continue
                ms.append({"n": m.get("groupItemTitle") or m.get("question"), "p": p, "s": m.get("slug")})
            if not ms: continue
            ms.sort(key=lambda x: x["p"], reverse=True)
            out.append({"slug": e["slug"], "t": e["title"], "vol": round(e.get("volume24hr") or 0), "tags": sorted(tags)[:4], "m": ms[:5]})
            if len(out) >= 9: break
        (pathlib.Path(__file__).resolve().parent.parent / "data" / "polymarket.json").write_text(json.dumps({"actualizado": datetime.datetime.now(datetime.timezone.utc).isoformat(), "items": out}, ensure_ascii=False, indent=1))
        print(len(out), "mercados Polymarket:", [x["t"][:40] for x in out])
    except Exception as ex: print("polymarket sin respuesta:", ex)
