#!/usr/bin/env python3
"""
GaLaBau Kompass · Site-Generator (v3, Editorial)

content/site.yaml          Navigation, Ressorts, Konfiguration
content/ausgaben.yaml      Editorials je Monatsausgabe
content/termine.yaml       Termine & Fristen (Seitenleiste)
content/artikel/*.md       Artikel (YAML-Front-Matter + Markdown)
content/seiten/*.md        Statische Seiten (ueber-uns, impressum, datenschutz, abo)
templates/*.html           Jinja2-Templates

Erzeugt: index.html, artikel/<slug>/, artikel/index.html (Archiv), ressort/<slug>/,
ausgaben/, ausgaben/<yyyy-mm>/ (+ print.html), <seite>/index.html, 404.html,
assets/artikel-index.json, sitemap.xml

Aufruf: python3 tools/build.py [--pdf]   (--pdf rendert die Ausgaben-PDFs via Chrome)
"""
import re, argparse, datetime as dt, json, os, subprocess
import yaml, markdown
from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]
WOCHENTAGE = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]

def de_date(d: dt.date, weekday=False) -> str:
    s = f"{d.day}. {MONATE[d.month - 1]} {d.year}"
    return f"{WOCHENTAGE[d.weekday()]}, {s}" if weekday else s

def kurz_date(d: dt.date) -> str:
    return d.strftime("%d.%m.%Y")

def to_date(v) -> dt.date:
    return v if isinstance(v, dt.date) else dt.date.fromisoformat(str(v))

def load_md(path: str) -> tuple[dict, str]:
    raw = open(path, encoding="utf-8").read()
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", raw, flags=re.S)
    if not m: raise ValueError(f"Front-Matter fehlt: {path}")
    return yaml.safe_load(m.group(1)) or {}, m.group(2)

MD = markdown.Markdown(extensions=["tables", "attr_list", "md_in_html", "sane_lists", "smarty"], output_format="html5")
def render_md(text: str) -> str:
    MD.reset()
    html = MD.convert(text)
    # Tabellen in einen horizontal scrollbaren Wrapper (Mobile-Overflow)
    html = re.sub(r'(?<!<div class="tabelle">)<table>', '<div class="tabelle"><table>', html)
    html = re.sub(r'</table>(?!</div>)', '</table></div>', html)
    return html

def words(html: str) -> int:
    return len(re.sub(r"<[^>]+>", " ", html).split())

def termin_label(t: dict) -> str:
    if t.get("label"): return t["label"]
    d, b = to_date(t["datum"]), to_date(t["bis"]) if t.get("bis") else None
    if b and b != d:
        if b.month == d.month and b.year == d.year: return f"{d.day}.–{b.day}.{d.month:02d}.{d.year}"
        return f"{kurz_date(d)} – {kurz_date(b)}"
    return kurz_date(d)

def build():
    site = yaml.safe_load(open(os.path.join(CONTENT, "site.yaml"), encoding="utf-8"))
    ausgaben_meta = yaml.safe_load(open(os.path.join(CONTENT, "ausgaben.yaml"), encoding="utf-8")) or {}
    termine_raw = yaml.safe_load(open(os.path.join(CONTENT, "termine.yaml"), encoding="utf-8")) or []
    ressorts = {r["slug"]: r for r in site["ressorts"]}
    heute = dt.date.today()
    env = Environment(loader=FileSystemLoader(os.path.join(ROOT, "templates")), autoescape=select_autoescape(["html"]), trim_blocks=True, lstrip_blocks=True)
    env.filters["de_date"] = lambda d, w=False: de_date(d, w)
    env.globals["site"] = site
    env.globals["heute"] = heute
    env.globals["heute_lang"] = de_date(heute, weekday=True)

    # ── Termine (nur kommende) ───────────────────────────────────
    termine = []
    for t in termine_raw:
        d = to_date(t["datum"]); b = to_date(t["bis"]) if t.get("bis") else d
        if b < heute: continue
        termine.append({"datum": d, "datum_iso": d.isoformat(), "label": termin_label(t), "titel": t["titel"], "ort": t.get("ort", ""), "link": t.get("link", ""), "monat": f"{MONATE[d.month - 1]} {d.year}", "tag": f"{d.day:02d}", "mon": MONATE[d.month - 1][:3]})
    termine.sort(key=lambda t: t["datum"])
    env.globals["termine"] = termine[:6]

    # ── Artikel einlesen ─────────────────────────────────────────
    artikel = []
    for fn in sorted(os.listdir(os.path.join(CONTENT, "artikel"))):
        if not fn.endswith(".md"): continue
        meta, body = load_md(os.path.join(CONTENT, "artikel", fn))
        slug = meta.get("slug") or fn[:-3]
        html = render_md(body)
        datum = to_date(meta["datum"])
        if meta["ressort"] not in ressorts: raise ValueError(f"{fn}: unbekanntes Ressort {meta['ressort']}")
        n = words(html)
        a = {
            "slug": slug, "title": meta["title"], "dek": meta.get("dek", ""), "datum": datum, "datum_iso": datum.isoformat(), "datum_de": de_date(datum), "datum_kurz": kurz_date(datum),
            "ressort": meta["ressort"], "ressort_name": ressorts[meta["ressort"]]["name"], "ressort_kurz": ressorts[meta["ressort"]]["kurz"], "tags": [str(t) for t in (meta.get("tags") or [])],
            "bild": meta.get("bild", slug), "bild_alt": meta.get("bild_alt", meta["title"]), "bild_caption": meta.get("bild_caption", ""), "bild_prompt": meta.get("bild_prompt", ""),
            "relevanz": int(meta.get("relevanz", 50)), "featured": bool(meta.get("featured", False)), "autor": meta.get("autor", "Redaktion GaLaBau Kompass"),
            "lesezeit": max(1, -(-n // 180)), "woerter": n, "quellen": meta.get("quellen", []), "stimmen": meta.get("stimmen", []),
            "html": html, "text": re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip(),
            "ausgabe": datum.strftime("%Y-%m"),
        }
        artikel.append(a)
    artikel.sort(key=lambda a: (a["datum"], a["relevanz"]), reverse=True)
    by_ressort: dict[str, list] = {r: [] for r in ressorts}
    for a in artikel: by_ressort[a["ressort"]].append(a)

    # ── Verwandte Beiträge (Tag-Überschneidung, Ressort-Bonus) + Vor/Zurück ──
    for i, a in enumerate(artikel):
        tags = {t.lower() for t in a["tags"]}
        def score(b):
            s = len(tags & {t.lower() for t in b["tags"]}) * 3 + (2 if b["ressort"] == a["ressort"] else 0)
            s -= min(abs((a["datum"] - b["datum"]).days) / 200, 2)
            return s
        cands = sorted((b for b in artikel if b["slug"] != a["slug"]), key=score, reverse=True)
        a["verwandt"] = cands[:3]
        a["neuer"] = artikel[i - 1] if i > 0 else None
        a["aelter"] = artikel[i + 1] if i + 1 < len(artikel) else None

    # ── Ausgaben (Monate) ────────────────────────────────────────
    ausgaben = []
    for ym in sorted({a["ausgabe"] for a in artikel}, reverse=True):
        y, m = ym.split("-")
        arts = [a for a in artikel if a["ausgabe"] == ym]
        lead = max(arts, key=lambda a: (a["featured"], a["relevanz"]))
        meta = ausgaben_meta.get(ym, {})
        ausgaben.append({
            "ym": ym, "nr": f"{m}/{y}", "label": f"Ausgabe {m}/{y}", "monat": f"{MONATE[int(m) - 1]} {y}", "titel": meta.get("titel", f"{MONATE[int(m) - 1]} {y}"),
            "editorial": meta.get("editorial", "").strip(), "artikel": arts, "lead": lead, "pdf": f"ausgaben/pdf/galabau-kompass-{ym}.pdf", "seiten": 4 + len(arts) * 2,
        })
    aktuelle = ausgaben[0] if ausgaben else None
    env.globals["aktuelle_ausgabe"] = aktuelle
    for a in artikel: a["ausgabe_obj"] = next((x for x in ausgaben if x["ym"] == a["ausgabe"]), None)

    meist = sorted(artikel, key=lambda a: (a["relevanz"], a["datum"]), reverse=True)[:6]
    env.globals["meist"] = meist
    env.globals["anzahl_gesamt"] = len(artikel)

    def write(path: str, html: str):
        full = os.path.join(ROOT, path)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        open(full, "w", encoding="utf-8").write(html)

    # ── Startseite ───────────────────────────────────────────────
    featured = [a for a in artikel if a["featured"]][:5] or artikel[:5]
    river = [a for a in artikel if a not in featured][:9]
    tags = {}
    for a in artikel:
        for t in a["tags"]: tags[t] = tags.get(t, 0) + 1
    top_tags = [t for t, _ in sorted(tags.items(), key=lambda x: (-x[1], x[0]))[:16]]
    ressort_bloecke = [{"ressort": ressorts[r], "artikel": by_ressort[r][:4]} for r in ressorts if by_ressort[r]]
    write("index.html", env.get_template("home.html").render(depth=0, featured=featured, river=river, bloecke=ressort_bloecke, top_tags=top_tags, ausgaben=ausgaben[:3], anzahl=len(artikel)))

    # ── Artikelseiten ────────────────────────────────────────────
    for a in artikel:
        write(f"artikel/{a['slug']}/index.html", env.get_template("artikel.html").render(depth=2, a=a, ausgabe=a["ausgabe_obj"], ressort=ressorts[a["ressort"]]))

    # ── Archiv + Index-JSON ──────────────────────────────────────
    index = [{"slug": a["slug"], "title": a["title"], "dek": a["dek"], "datum": a["datum_iso"], "datum_kurz": a["datum_kurz"], "ressort": a["ressort"], "ressort_name": a["ressort_name"], "tags": a["tags"], "bild": a["bild"], "relevanz": a["relevanz"], "lesezeit": a["lesezeit"], "featured": a["featured"], "text": a["text"][:1200]} for a in artikel]
    write("assets/artikel-index.json", json.dumps({"generiert": dt.datetime.now().isoformat(timespec="minutes"), "ressorts": [{"slug": r["slug"], "name": r["name"]} for r in site["ressorts"]], "artikel": index}, ensure_ascii=False))
    write("artikel/index.html", env.get_template("archiv.html").render(depth=1, anzahl=len(artikel), top_tags=top_tags, preset_ressort=None, aeltestes=artikel[-1]["datum"]))
    for r in site["ressorts"]:
        write(f"ressort/{r['slug']}/index.html", env.get_template("ressort.html").render(depth=2, ressort=r, artikel=by_ressort[r["slug"]], anzahl=len(by_ressort[r["slug"]])))

    # ── Ausgaben ─────────────────────────────────────────────────
    write("ausgaben/index.html", env.get_template("ausgaben.html").render(depth=1, ausgaben=ausgaben))
    for x in ausgaben:
        write(f"ausgaben/{x['ym']}/index.html", env.get_template("ausgabe.html").render(depth=2, x=x))
        write(f"ausgaben/{x['ym']}/print.html", env.get_template("print.html").render(depth=2, x=x, ressorts=ressorts))

    # ── Statische Seiten + 404 ───────────────────────────────────
    seiten_dir = os.path.join(CONTENT, "seiten")
    for fn in sorted(os.listdir(seiten_dir)):
        if not fn.endswith(".md"): continue
        meta, body = load_md(os.path.join(seiten_dir, fn))
        slug = meta.get("slug") or fn[:-3]
        write(f"{slug}/index.html", env.get_template("page.html").render(depth=1, p=meta, html=render_md(body), slug=slug))
    write("404.html", env.get_template("404.html").render(depth=0, neueste=artikel[:5]))

    # ── Sitemap ──────────────────────────────────────────────────
    base = f"https://{site['domain']}"
    urls = [""] + [f"artikel/{a['slug']}/" for a in artikel] + [f"ressort/{r}/" for r in ressorts] + ["artikel/", "ausgaben/"] + [f"ausgaben/{x['ym']}/" for x in ausgaben] + ["standort/", "branchenumfrage/", "ueber-uns/", "abo/"]
    write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(f"  <url><loc>{base}/{u}</loc></url>" for u in urls) + "\n</urlset>\n")

    print(f"✓ {len(artikel)} Artikel · {len(ressorts)} Ressorts · {len(ausgaben)} Ausgaben · {len(termine)} Termine")
    return ausgaben

def render_pdfs(ausgaben):
    out = os.path.join(ROOT, "ausgaben", "pdf"); os.makedirs(out, exist_ok=True)
    for x in ausgaben:
        src = os.path.join(ROOT, "ausgaben", x["ym"], "print.html")
        pdf = os.path.join(out, f"galabau-kompass-{x['ym']}.pdf")
        subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--allow-file-access-from-files", "--no-pdf-header-footer", f"--print-to-pdf={pdf}", f"file://{src}"], check=True, capture_output=True)
        print("  PDF", x["label"], f"{os.path.getsize(pdf) // 1024} KB")

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--pdf", action="store_true"); a = ap.parse_args()
    ausg = build()
    if a.pdf: render_pdfs(ausg)
