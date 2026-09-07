#!/usr/bin/env python3
"""
GaLaBau Kompass · Site-Generator (v5)

content/site.yaml          Navigation, Ressorts, Konfiguration
content/ausgaben.yaml      Editorials je Monatsausgabe
content/termine.yaml       Termine & Fristen
content/dossiers.yaml      Themenseiten (Dossiers) über Tag-Listen
content/zahlen.yaml        Kennzahlen der Branche (mit Quelle) → SVG-Mini-Charts
content/fragen.yaml        Frage der Woche (Abstimmung)
content/artikel/*.md       Beiträge (YAML-Front-Matter + Markdown); Feld `format`:
                           artikel (Standard) · meldung (kurz, ohne Bild) · produkt (Steckbrief) ·
                           standpunkt (Kommentar) · praxisfrage (Frage/Antwort)
content/seiten/*.md        Statische Seiten
templates/*.html           Jinja2-Templates

Erzeugt: index.html, artikel/<slug>/, artikel/index.html, ressort/<slug>/, thema/<slug>/, ausgaben/…,
termine/, newsletter/ (+ abo/ Weiterleitung), zahlen/, merkliste/, club/, <seite>/, 404.html,
assets/artikel-index.json, sitemap.xml

Aufruf: python3 tools/build.py [--pdf]
"""
import re, argparse, datetime as dt, json, os, subprocess, html as htmllib
import yaml, markdown
from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]
WOCHENTAGE = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
FORMATE = {"artikel": "Beitrag", "meldung": "Meldung", "produkt": "Produkt", "standpunkt": "Standpunkt", "praxisfrage": "Praxisfrage"}
# Zielgruppen-Schalter: Feld `zielgruppe` (betriebe | fachkraefte | beide); fehlt es, Ableitung aus dem Ressort
ZIELGRUPPEN = {"betriebe": "Für Betriebe", "fachkraefte": "Für Fachkräfte"}
ZIELGRUPPE_RESSORT = {"betrieb-personal": "betriebe", "markt-politik": "betriebe", "produkte": "betriebe", "technik-digital": "betriebe", "standpunkt": "betriebe",
                      "karriere": "fachkraefte", "sicherheit-gesundheit": "fachkraefte", "recht-tarif": "beide", "bauen-pflanzen": "beide", "messe-termine": "beide"}
def sortiert(liste, fuer):
    """Gewählte Zielgruppe zuerst, dann beide, dann die andere – innerhalb bleibt die Reihenfolge (Datum, Relevanz)."""
    if not fuer: return list(liste)
    return sorted(liste, key=lambda a: 0 if a["zielgruppe"] == fuer else (1 if a["zielgruppe"] == "beide" else 2))

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

def fmt_zahl(v, einheit=""):
    if isinstance(v, float):
        s = f"{v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        s = s.rstrip("0").rstrip(",") if "," in s else s
    else:
        s = f"{v:,}".replace(",", ".")
    return s + (f" {einheit}" if einheit and einheit not in ("%", "€") else einheit)

def chart_svg(z: dict) -> str:
    """Kleiner Balken- oder Linienchart als Inline-SVG (ohne Abhängigkeiten)."""
    serie = z.get("serie") or []
    if len(serie) < 2: return ""
    W, H, pad = 220, 80, 6
    ys = [float(p["y"]) for p in serie]; lo, hi = min(ys), max(ys)
    if z.get("ab_null", True) and lo > 0: lo = 0
    span = (hi - lo) or 1
    n = len(serie); parts = []
    if z.get("chart", "bar") == "bar":
        bw = (W - pad * 2) / n * 0.62; gap = (W - pad * 2) / n
        for i, p in enumerate(serie):
            h = (float(p["y"]) - lo) / span * (H - 26); x = pad + i * gap + (gap - bw) / 2; y = H - 18 - h
            last = i == n - 1
            parts.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{bw:.1f}" height="{max(h, 1):.1f}" rx="2" class="{"c-akt" if last else "c-alt"}"/>')
            parts.append(f'<text x="{x + bw / 2:.1f}" y="{H - 5}" text-anchor="middle" class="c-x">{htmllib.escape(str(p["x"]))}</text>')
    else:
        pts = []
        for i, p in enumerate(serie):
            x = pad + i * (W - pad * 2) / (n - 1); y = H - 18 - (float(p["y"]) - lo) / span * (H - 26); pts.append((x, y))
            parts.append(f'<text x="{x:.1f}" y="{H - 5}" text-anchor="{"start" if i == 0 else ("end" if i == n - 1 else "middle")}" class="c-x">{htmllib.escape(str(p["x"]))}</text>')
        parts.insert(0, '<polyline points="' + " ".join(f"{x:.1f},{y:.1f}" for x, y in pts) + '" class="c-line"/>')
        for i, (x, y) in enumerate(pts): parts.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{3.4 if i == n - 1 else 2.4}" class="{"c-akt" if i == n - 1 else "c-alt"}"/>')
    return f'<svg viewBox="0 0 {W} {H}" class="chart" role="img" aria-label="{htmllib.escape(z["label"])}">' + "".join(parts) + "</svg>"

def build():
    site = yaml.safe_load(open(os.path.join(CONTENT, "site.yaml"), encoding="utf-8"))
    ausgaben_meta = yaml.safe_load(open(os.path.join(CONTENT, "ausgaben.yaml"), encoding="utf-8")) or {}
    termine_raw = yaml.safe_load(open(os.path.join(CONTENT, "termine.yaml"), encoding="utf-8")) or []
    dossiers_raw = yaml.safe_load(open(os.path.join(CONTENT, "dossiers.yaml"), encoding="utf-8")) or []
    zahlen_raw = yaml.safe_load(open(os.path.join(CONTENT, "zahlen.yaml"), encoding="utf-8")) or []
    fragen_raw = yaml.safe_load(open(os.path.join(CONTENT, "fragen.yaml"), encoding="utf-8")) or []
    ressorts = {r["slug"]: r for r in site["ressorts"]}
    heute = dt.date.today()
    env = Environment(loader=FileSystemLoader(os.path.join(ROOT, "templates")), autoescape=select_autoescape(["html"]), trim_blocks=True, lstrip_blocks=True)
    env.filters["de_date"] = lambda d, w=False: de_date(d, w)
    site_json = json.dumps({"api_base": site.get("api_base"), "stand": heute.isoformat(), "social": [s for s in (site.get("social") or []) if s.get("url")],
                            "ressorts": [[r["slug"], r["name"], r["kurz"], r.get("nav", r["kurz"])] for r in site["ressorts"]]}, ensure_ascii=False).replace("</", "<\\/")
    env.globals.update(site=site, heute=heute, heute_lang=de_date(heute, weekday=True), FORMATE=FORMATE, site_json=site_json)

    # ── Termine ──────────────────────────────────────────────────
    termine = []
    for t in termine_raw:
        d = to_date(t["datum"]); b = to_date(t["bis"]) if t.get("bis") else d
        termine.append({"datum": d, "bis": b, "datum_iso": d.isoformat(), "label": termin_label(t), "titel": t["titel"], "ort": t.get("ort", ""), "link": t.get("link", ""), "art": t.get("art", "Termin"),
                        "monat": f"{MONATE[d.month - 1]} {d.year}", "vorbei": b < heute, "bis_iso": b.isoformat(), "beschreibung": t.get("beschreibung", "")})
    termine.sort(key=lambda t: t["datum"])
    kommende = [t for t in termine if not t["vorbei"]]
    env.globals["termine"] = kommende[:6]

    # ── Artikel einlesen ─────────────────────────────────────────
    artikel = []
    for fn in sorted(os.listdir(os.path.join(CONTENT, "artikel"))):
        if not fn.endswith(".md"): continue
        meta, body = load_md(os.path.join(CONTENT, "artikel", fn))
        slug = meta.get("slug") or fn[:-3]
        html = render_md(body)
        datum = to_date(meta["datum"])
        if meta["ressort"] not in ressorts: raise ValueError(f"{fn}: unbekanntes Ressort {meta['ressort']}")
        fmt = meta.get("format", "artikel")
        if fmt not in FORMATE: raise ValueError(f"{fn}: unbekanntes Format {fmt}")
        zielgruppe = meta.get("zielgruppe") or ZIELGRUPPE_RESSORT[meta["ressort"]]
        if zielgruppe not in ("betriebe", "fachkraefte", "beide"): raise ValueError(f"{fn}: unbekannte Zielgruppe {zielgruppe}")
        bild = meta.get("bild", slug)
        if bild in ("none", "", None) or fmt == "meldung" and "bild" not in meta: bild = None
        n = words(html)
        a = {
            "slug": slug, "title": meta["title"], "dek": meta.get("dek", ""), "datum": datum, "datum_iso": datum.isoformat(), "datum_de": de_date(datum), "datum_kurz": kurz_date(datum),
            "ressort": meta["ressort"], "ressort_name": ressorts[meta["ressort"]]["name"], "ressort_kurz": ressorts[meta["ressort"]]["kurz"], "tags": [str(t) for t in (meta.get("tags") or [])],
            "format": fmt, "format_name": FORMATE[fmt], "kurz": meta.get("kurz") or [], "antwort": meta.get("antwort", ""), "steckbrief": meta.get("steckbrief") or {},
            "bild": bild, "bild_alt": meta.get("bild_alt", meta["title"]), "bild_caption": meta.get("bild_caption", ""), "bild_prompt": meta.get("bild_prompt", ""),
            "relevanz": int(meta.get("relevanz", 50)), "featured": bool(meta.get("featured", False)), "autor": meta.get("autor", "Redaktion GaLaBau Kompass"),
            "lesezeit": max(1, -(-n // 180)), "woerter": n, "quellen": meta.get("quellen", []), "stimmen": meta.get("stimmen", []),
            "html": html, "text": re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip(),
            "ausgabe": datum.strftime("%Y-%m"), "neu": 0 <= (heute - datum).days <= 7, "zielgruppe": zielgruppe,
        }
        artikel.append(a)
    artikel.sort(key=lambda a: (a["datum"], a["relevanz"]), reverse=True)
    lang = [a for a in artikel if a["format"] != "meldung"]          # alles außer Kurzmeldungen
    meldungen = [a for a in artikel if a["format"] == "meldung"]
    by_ressort: dict[str, list] = {r: [] for r in ressorts}
    for a in artikel: by_ressort[a["ressort"]].append(a)

    # ── Verwandte Beiträge + Vor/Zurück ──────────────────────────
    for i, a in enumerate(lang):
        tags = {t.lower() for t in a["tags"]}
        def score(b):
            s = len(tags & {t.lower() for t in b["tags"]}) * 3 + (2 if b["ressort"] == a["ressort"] else 0)
            s -= min(abs((a["datum"] - b["datum"]).days) / 200, 2)
            return s
        a["verwandt"] = sorted((b for b in lang if b["slug"] != a["slug"]), key=score, reverse=True)[:3]
        a["neuer"] = lang[i - 1] if i > 0 else None
        a["aelter"] = lang[i + 1] if i + 1 < len(lang) else None
    for i, a in enumerate(meldungen):
        a["verwandt"] = []; a["neuer"] = meldungen[i - 1] if i > 0 else None; a["aelter"] = meldungen[i + 1] if i + 1 < len(meldungen) else None

    # ── Dossiers ─────────────────────────────────────────────────
    dossiers = []
    for d in dossiers_raw:
        tset = {t.lower() for t in d.get("tags", [])}; rset = set(d.get("ressorts", []))
        arts = [a for a in artikel if ({t.lower() for t in a["tags"]} & tset) or (a["ressort"] in rset)]
        dossiers.append({"slug": d["slug"], "titel": d["titel"], "kurz": d.get("kurz", d["titel"]), "intro": d.get("intro", ""), "tags": d.get("tags", []), "artikel": arts, "lead": arts[0] if arts else None, "anzahl": len(arts)})
    env.globals["dossiers"] = dossiers

    # ── Ausgaben (Monate, laufende Nummer) ───────────────────────
    ausgaben = []
    yms = sorted({a["ausgabe"] for a in artikel})
    for k, ym in enumerate(yms):
        y, m = ym.split("-")
        arts = [a for a in artikel if a["ausgabe"] == ym]
        arts_lang = [a for a in arts if a["format"] != "meldung"]
        lead = max(arts_lang or arts, key=lambda a: (a["featured"], a["relevanz"]))
        meta = ausgaben_meta.get(ym, {})
        ausgaben.append({
            "ym": ym, "nr": f"{m}/{y}", "lauf": k + 1, "label": f"Ausgabe {m}/{y}", "monat": f"{MONATE[int(m) - 1]} {y}", "titel": meta.get("titel", f"{MONATE[int(m) - 1]} {y}"),
            "editorial": meta.get("editorial", "").strip(), "artikel": arts_lang, "meldungen": [a for a in arts if a["format"] == "meldung"], "alle": arts, "lead": lead,
            "pdf": f"ausgaben/pdf/galabau-kompass-{ym}.pdf",
        })
    ausgaben.reverse()
    aktuelle = ausgaben[0] if ausgaben else None
    env.globals["aktuelle_ausgabe"] = aktuelle
    for a in artikel: a["ausgabe_obj"] = next((x for x in ausgaben if x["ym"] == a["ausgabe"]), None)

    meist = sorted(lang, key=lambda a: (a["relevanz"], a["datum"]), reverse=True)[:6]
    env.globals.update(meist=meist, anzahl_gesamt=len(artikel))

    # ── Zahlen (Kennzahlen mit Chart) ────────────────────────────
    by_slug = {a["slug"]: a for a in artikel}
    zahlen = []
    for z in zahlen_raw:
        q = by_slug.get(z.get("quelle_slug"))
        zahlen.append({**z, "wert_fmt": z.get("wert_text") or fmt_zahl(z["wert"], z.get("einheit", "")), "svg": chart_svg(z), "quelle": q, "quelle_titel": z.get("quelle_titel") or (q["title"] if q else "")})
    env.globals["zahlen"] = zahlen

    # ── Vorlagen (Club) ──────────────────────────────────────────
    vorlagen = []
    vdir = os.path.join(CONTENT, "vorlagen")
    if os.path.isdir(vdir):
        for fn in sorted(os.listdir(vdir)):
            if not fn.endswith(".md"): continue
            meta, body = load_md(os.path.join(vdir, fn))
            slug = meta.get("slug") or fn[:-3]; stand = to_date(meta.get("stand", heute))
            vorlagen.append({"slug": slug, "title": meta["title"], "dek": meta.get("dek", ""), "typ": meta.get("typ", "Vorlage"), "stand": stand, "stand_de": de_date(stand),
                             "quelle": by_slug.get(meta.get("quelle_slug")), "html": render_md(body), "pdf": f"vorlagen/pdf/{slug}.pdf"})
    env.globals["vorlagen"] = vorlagen

    # ── Frage der Woche ──────────────────────────────────────────
    fragen = sorted(fragen_raw, key=lambda f: str(f.get("seit", "")), reverse=True)
    env.globals["frage"] = fragen[0] if fragen else None
    env.globals["fragen"] = fragen

    def write(path: str, html: str):
        full = os.path.join(ROOT, path)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        open(full, "w", encoding="utf-8").write(html)

    # ── Startseite ───────────────────────────────────────────────
    featured_alle = [a for a in lang if a["featured"]][:5] or lang[:5]
    tags = {}
    for a in artikel:
        for t in a["tags"]: tags[t] = tags.get(t, 0) + 1
    top_tags = [t for t, _ in sorted(tags.items(), key=lambda x: (-x[1], x[0]))[:16]]
    produkte = [a for a in lang if a["format"] == "produkt"][:4]
    standpunkte = [a for a in lang if a["format"] == "standpunkt"][:2]
    praxisfragen = [a for a in lang if a["format"] == "praxisfrage"][:4]
    def startseite(fuer, pfad, depth):
        """Gemischte Sicht (fuer=None) oder Zielgruppen-Sicht: Aufmacher, Fluss und Ressort-Blöcke sortiert, alles andere identisch."""
        if fuer:
            eigene = [a for a in featured_alle if a["zielgruppe"] == fuer]
            if len(eigene) < 3:  # Aufmacher aus dem gesamten Pool auffüllen: relevanteste Beiträge der Zielgruppe
                for a in sorted((x for x in lang if x["zielgruppe"] == fuer and x["format"] == "artikel" and x not in featured_alle), key=lambda x: (x["relevanz"], x["datum"]), reverse=True):
                    eigene.append(a)
                    if len(eigene) >= 3: break
            featured = (eigene + [a for a in featured_alle if a["zielgruppe"] == "beide" and a not in eigene] + [a for a in featured_alle if a not in eigene and a["zielgruppe"] != "beide"])[:5]
        else:
            featured = featured_alle
        river = sortiert([a for a in lang if a not in featured and a["format"] == "artikel"], fuer)[:8]
        bloecke = [{"ressort": ressorts[r], "artikel": sortiert([a for a in by_ressort[r] if a["format"] != "meldung"], fuer)[:4]} for r in ressorts if by_ressort[r]]
        write(pfad, env.get_template("home.html").render(depth=depth, fuer=fuer, fuer_label=ZIELGRUPPEN.get(fuer), featured=featured, river=river, meldungen=meldungen[:8], bloecke=bloecke, top_tags=top_tags,
                                                          produkte=produkte, standpunkte=standpunkte, praxisfragen=praxisfragen, anzahl=len(artikel), ausgaben_anzahl=len(ausgaben)))
    startseite(None, "index.html", 0)
    startseite("betriebe", "fuer-betriebe/index.html", 1)
    startseite("fachkraefte", "fuer-fachkraefte/index.html", 1)

    # ── Artikelseiten ────────────────────────────────────────────
    for a in artikel:
        write(f"artikel/{a['slug']}/index.html", env.get_template("artikel.html").render(depth=2, a=a, ausgabe=a["ausgabe_obj"], ressort=ressorts[a["ressort"]]))

    # ── Archiv + Index-JSON ──────────────────────────────────────
    index = [{"slug": a["slug"], "title": a["title"], "dek": a["dek"], "datum": a["datum_iso"], "datum_kurz": a["datum_kurz"], "ressort": a["ressort"], "ressort_name": a["ressort_name"], "tags": a["tags"],
              "bild": a["bild"], "relevanz": a["relevanz"], "lesezeit": a["lesezeit"], "featured": a["featured"], "format": a["format"], "format_name": a["format_name"], "neu": a["neu"], "zielgruppe": a["zielgruppe"], "text": a["text"][:1200]} for a in artikel]
    write("assets/artikel-index.json", json.dumps({"generiert": heute.isoformat(), "ressorts": [{"slug": r["slug"], "name": r["name"]} for r in site["ressorts"]], "artikel": index}, ensure_ascii=False))
    write("artikel/index.html", env.get_template("archiv.html").render(depth=1, anzahl=len(artikel), top_tags=top_tags, preset_ressort=None, aeltestes=artikel[-1]["datum"]))
    for r in site["ressorts"]:
        arts = [a for a in by_ressort[r["slug"]] if a["format"] != "meldung"]; melds = [a for a in by_ressort[r["slug"]] if a["format"] == "meldung"]
        write(f"ressort/{r['slug']}/index.html", env.get_template("ressort.html").render(depth=2, ressort=r, artikel=arts, meldungen=melds, anzahl=len(by_ressort[r["slug"]])))
    for d in dossiers:
        write(f"thema/{d['slug']}/index.html", env.get_template("thema.html").render(depth=2, d=d))

    # ── Ausgaben ─────────────────────────────────────────────────
    write("ausgaben/index.html", env.get_template("ausgaben.html").render(depth=1, ausgaben=ausgaben))
    for x in ausgaben:
        write(f"ausgaben/{x['ym']}/index.html", env.get_template("ausgabe.html").render(depth=2, x=x))
        write(f"ausgaben/{x['ym']}/print.html", env.get_template("print.html").render(depth=2, x=x, ressorts=ressorts))

    # ── Weitere Seiten ───────────────────────────────────────────
    monate = []
    for t in kommende:
        if not monate or monate[-1]["monat"] != t["monat"]: monate.append({"monat": t["monat"], "liste": []})
        monate[-1]["liste"].append(t)
    write("termine/index.html", env.get_template("termine.html").render(depth=1, monate=monate, vergangene=[t for t in termine if t["vorbei"]][::-1]))
    write("newsletter/index.html", env.get_template("newsletter.html").render(depth=1, neueste=lang[:5], meld=meldungen[:4]))
    write("abo/index.html", '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=../newsletter/"><title>Weiterleitung</title></head><body><a href="../newsletter/">Weiter zum Newsletter</a></body></html>')
    write("zahlen/index.html", env.get_template("zahlen.html").render(depth=1))
    write("merkliste/index.html", env.get_template("merkliste.html").render(depth=1))
    write("club/index.html", env.get_template("club.html").render(depth=1))
    write("club/anmelden/index.html", env.get_template("anmelden.html").render(depth=2))
    write("boerse/index.html", env.get_template("boerse.html").render(depth=1))
    write("vorlagen/index.html", env.get_template("vorlagen.html").render(depth=1))
    for v in vorlagen:
        write(f"vorlagen/{v['slug']}/index.html", env.get_template("vorlage.html").render(depth=2, v=v))
        write(f"vorlagen/{v['slug']}/print.html", env.get_template("vorlage_print.html").render(depth=2, v=v))
    seiten_dir = os.path.join(CONTENT, "seiten")
    for fn in sorted(os.listdir(seiten_dir)):
        if not fn.endswith(".md"): continue
        meta, body = load_md(os.path.join(seiten_dir, fn))
        slug = meta.get("slug") or fn[:-3]
        if slug == "abo": continue
        write(f"{slug}/index.html", env.get_template("page.html").render(depth=1, p=meta, html=render_md(body), slug=slug))
    write("404.html", env.get_template("404.html").render(depth=0, neueste=lang[:5]))

    # ── Sitemap ──────────────────────────────────────────────────
    base = f"https://{site['domain']}"
    urls = ["", "fuer-betriebe/", "fuer-fachkraefte/"] + [f"artikel/{a['slug']}/" for a in artikel] + [f"ressort/{r}/" for r in ressorts] + [f"thema/{d['slug']}/" for d in dossiers] + ["artikel/", "ausgaben/", "termine/", "newsletter/", "zahlen/", "club/", "club/anmelden/", "boerse/", "vorlagen/"] + [f"vorlagen/{v['slug']}/" for v in vorlagen] + [f"ausgaben/{x['ym']}/" for x in ausgaben] + ["standort/", "branchenumfrage/", "ueber-uns/"]
    write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(f"  <url><loc>{base}/{u}</loc></url>" for u in urls) + "\n</urlset>\n")

    print(f"✓ {len(lang)} Beiträge + {len(meldungen)} Meldungen · {len(ressorts)} Ressorts · {len(dossiers)} Dossiers · {len(ausgaben)} Ausgaben · {len(kommende)} Termine · {len(zahlen)} Zahlen · {len(vorlagen)} Vorlagen")
    return ausgaben, vorlagen

def render_pdfs(ausgaben, vorlagen=()):
    out = os.path.join(ROOT, "ausgaben", "pdf"); os.makedirs(out, exist_ok=True)
    vout = os.path.join(ROOT, "vorlagen", "pdf"); os.makedirs(vout, exist_ok=True)
    jobs = [(os.path.join(ROOT, "ausgaben", x["ym"], "print.html"), os.path.join(out, f"galabau-kompass-{x['ym']}.pdf"), x["label"]) for x in ausgaben]
    jobs += [(os.path.join(ROOT, "vorlagen", v["slug"], "print.html"), os.path.join(vout, f"{v['slug']}.pdf"), "Vorlage " + v["slug"]) for v in vorlagen]
    for src, pdf, label in jobs:
        cmd = [CHROME, "--headless=new", "--disable-gpu", "--allow-file-access-from-files", "--no-pdf-header-footer", "--virtual-time-budget=12000", f"--print-to-pdf={pdf}", f"file://{src}"]
        for versuch in range(2):  # Chrome hängt gelegentlich nach dem Druck → Zeitlimit + ein Wiederholungsversuch
            try:
                subprocess.run(cmd, check=True, capture_output=True, timeout=150); break
            except (subprocess.TimeoutExpired, subprocess.CalledProcessError) as e:
                if versuch: raise
                print("  PDF", label, "Wiederholung nach", type(e).__name__)
        print("  PDF", label, f"{os.path.getsize(pdf) // 1024} KB")

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--pdf", action="store_true"); a = ap.parse_args()
    ausg, vorl = build()
    if a.pdf: render_pdfs(ausg, vorl)
