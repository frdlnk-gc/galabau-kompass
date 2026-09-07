#!/usr/bin/env python3
"""
GaLaBau Kompass · Artikelbilder per gpt-image-2 (OpenAI Images API)

Liest content/artikel/*.md (Front-Matter `bild_prompt`), erzeugt je Artikel ein
Querformat-Foto ohne Text/Logos und legt es als assets/img/<bild>.jpg (1600 px)
+ assets/img/<bild>-thumb.jpg (640 px) ab. Vorhandene Dateien werden übersprungen.

Key: $OPENAI_API_KEY (oder --env <datei> mit KEY=WERT-Zeilen).
Aufruf: python3 tools/gen_bilder.py [--only slug] [--quality medium|high] [--force]
Extra-Bilder (Slider/Cover) über content/bilder.yaml: {name: prompt}
"""
import argparse, base64, io, json, os, re, sys, time, urllib.request
import yaml
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STYLE = ("Editorial documentary photograph for a German trade magazine about garden and landscape construction (Garten- und Landschaftsbau). "
         "Realistic, natural daylight, 35mm lens look, muted natural colors, authentic German setting, believable people in modern work clothes, "
         "no text, no lettering, no signs, no logos, no watermarks, no brand names. Sharp, high detail, magazine quality. ")

def load_key(envfile):
    k = os.environ.get("OPENAI_API_KEY")
    if not k and envfile and os.path.isfile(envfile):
        for line in open(envfile, encoding="utf-8"):
            m = re.match(r'^\s*(?:export\s+)?OPENAI_API_KEY\s*=\s*(.+?)\s*$', line)
            if m: k = m.group(1).strip().strip('"').strip("'")
    if not k: sys.exit("OPENAI_API_KEY fehlt")
    return k

def generate(key, prompt, quality):
    body = json.dumps({"model": os.environ.get("GC_IMAGE_MODEL", "gpt-image-2"), "prompt": STYLE + prompt, "size": "1536x1024", "quality": quality, "n": 1}).encode()
    req = urllib.request.Request("https://api.openai.com/v1/images/generations", data=body, headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=240) as r:
                j = json.load(r)
                return base64.b64decode(j["data"][0]["b64_json"])
        except Exception as e:
            print("   Fehler:", str(e)[:200]); time.sleep(8)
    return None

def save(png_bytes, name):
    im = Image.open(io.BytesIO(png_bytes)).convert("RGB")
    out = os.path.join(ROOT, "assets", "img")
    big = im.copy(); big.thumbnail((1600, 1600)); big.save(os.path.join(out, name + ".jpg"), quality=82, optimize=True, progressive=True)
    th = im.copy(); th.thumbnail((640, 640)); th.save(os.path.join(out, name + "-thumb.jpg"), quality=72)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--only"); ap.add_argument("--quality", default="medium"); ap.add_argument("--force", action="store_true"); ap.add_argument("--env")
    a = ap.parse_args(); key = load_key(a.env)
    jobs = []
    for fn in sorted(os.listdir(os.path.join(ROOT, "content", "artikel"))):
        if not fn.endswith(".md"): continue
        raw = open(os.path.join(ROOT, "content", "artikel", fn), encoding="utf-8").read()
        m = re.match(r"^---\n(.*?)\n---", raw, flags=re.S); meta = yaml.safe_load(m.group(1))
        name = meta.get("bild") or fn[:-3]
        if meta.get("bild_prompt"): jobs.append((name, meta["bild_prompt"], "high" if meta.get("featured") else a.quality))
    extra = os.path.join(ROOT, "content", "bilder.yaml")
    if os.path.isfile(extra):
        for name, prompt in (yaml.safe_load(open(extra, encoding="utf-8")) or {}).items(): jobs.append((name, prompt, "high"))
    seen = set(); jobs = [j for j in jobs if not (j[0] in seen or seen.add(j[0]))]
    done = 0
    for name, prompt, quality in jobs:
        if a.only and name != a.only: continue
        target = os.path.join(ROOT, "assets", "img", name + ".jpg")
        if os.path.isfile(target) and not a.force: continue
        print(f"→ {name} ({quality})"); t = time.time()
        png = generate(key, prompt, quality)
        if not png: print("   ⛔ übersprungen"); continue
        save(png, name); done += 1; print(f"   ✓ {time.time() - t:.0f}s")
    print(f"fertig: {done} Bilder")

if __name__ == "__main__":
    main()
