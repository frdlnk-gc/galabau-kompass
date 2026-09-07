#!/usr/bin/env python3
"""
GaLaBau Kompass · Polo-Druckdateien (Messe GaLaBau 2026)

Erzeugt je Vertriebler eine Druck-PDF (Vektor, Fonts eingebettet) mit
  Seite 1  VORNE   – Brustlogo, Druckfläche 90 × 100 mm (Variante C)
  Seite 2  HINTEN  – Druckfläche 300 × 380 mm
  Seite 3  SPEC    – A4-Datenblatt für den Textildrucker (Name, Größe,
                     Farben, Platzierung, QR-Ziel)
plus PNG-Vorschauen. QR = Vektor (segno), heller Kachelgrund mit schwarzen
Modulen (zuverlässig scannbar, auch bei Inversion nicht nötig).

Aufruf:  python3 tools/polo_print.py [--domain galabau-kompass.de] [--size fabio=XL ...]
Ausgabe: print/<slug>/  (PDF + PNGs) und print/_work/
"""
import argparse, io, os, subprocess, sys, json, shutil
import segno

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PEOPLE = [
    {"slug": "fabio",  "name": "Fabio Zindel"},
    {"slug": "niklas", "name": "Niklas Kühme"},
    {"slug": "nick",   "name": "Nick Scheffler"},
    {"slug": "julian", "name": "Julian Kohansal"},
    {"slug": "liam",   "name": "Liam Quick"},
]
CREME, HONIG, BLACK = "#F2F7F3", "#CDF47A", "#000000"  # Hell, Lime (Akzent der v5-Farbwelt), Polo-Grund
GRUEN = "#23A551"

MARK = '''<svg class="mark" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="none" stroke="{ink}" stroke-width="2.4"/><path d="M32 7 42.5 32 32 26.5 21.5 32Z" fill="{accent}"/><path d="M32 57 21.5 32 32 37.5 42.5 32Z" fill="{ink}"/></svg>'''
# Handgezeichneter Pfeil („mit Edding“): zwei leicht versetzte Striche + offene Spitze, zeigt auf den QR-Code
PFEIL = '''<svg class="pfeil" viewBox="0 0 120 130" fill="none" stroke="{accent}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 12 C 36 2, 64 14, 78 44 S 92 96, 80 116"/><path d="M12 15 C 38 6, 62 18, 76 46" stroke-width="3" opacity=".55"/><path d="M60 100 L 80 118 L 100 98"/></svg>'''

def qr_svg(url: str) -> str:
    q = segno.make(url, error="h")
    buf = io.BytesIO()
    q.save(buf, kind="svg", xmldecl=False, svgns=True, scale=10, border=0, dark=BLACK, light=None, svgclass=None, lineclass=None, omitsize=True)
    return buf.getvalue().decode("utf-8")

def page(kind: str, person: dict, url: str, w: int, h: int) -> str:
    """Variante C (Freddy, 07.09.): vorne Marke + kleine Wortmarke auf der Brust, hinten Frage, QR mit Edding-Pfeil, Wortmarke."""
    if kind == "front":
        return f'''
<section class="page front" style="width:{w}mm;height:{h}mm;">
  <div class="marke">{MARK.format(ink=CREME, accent=GRUEN)}</div>
  <div class="word klein">GaLaBau Kompass</div>
</section>'''
    return f'''
<section class="page back" style="width:{w}mm;height:{h}mm;">
  <div class="frage">Wie viele Fachkräfte<br>gibt es bei Ihnen?</div>
  <div class="qrwrap" style="width:190mm;height:190mm;">{qr_svg(url)}</div>
  {PFEIL.format(accent=HONIG)}
  <div class="unten">
    <div class="line2">Kostenlos scannen · Standort-Check</div>
    <div class="logo">{MARK.format(ink=CREME, accent=GRUEN)}<div class="word">GaLaBau Kompass</div></div>
    <div class="foot">galabau-kompass.de</div>
  </div>
</section>'''

def spec(person: dict, size: str, url: str) -> str:
    return f'''
<section class="page spec" style="width:210mm;height:297mm;">
  <h1>Druckdatenblatt · Polo {person["name"]}</h1>
  <table>
    <tr><th>Träger</th><td>{person["name"]} · Kürzel <b>{person["slug"]}</b></td></tr>
    <tr><th>Polo-Größe</th><td><b>{size}</b></td></tr>
    <tr><th>Polo-Farbe</th><td>Schwarz (dunkler Grund, Baumwoll-Piqué)</td></tr>
    <tr><th>Druckfarben</th><td>Hell <b>{CREME}</b> · Grün <b>{GRUEN}</b> (Nadel) · Lime <b>{HONIG}</b> (Pfeil, Zeile) – Sonderfarben nach HEX, Pantone/HKS mit der Druckerei abstimmen · QR-Kachel Hell mit Modulen Schwarz</td></tr>
    <tr><th>Seite 1 – VORNE</th><td>Brustlogo links: Druckfläche 90 × 100 mm, Marke 60 mm, darunter Wortmarke. Platzierung auf Höhe des untersten Knopfs, Mitte der linken Brustseite (aus Trägersicht links).</td></tr>
    <tr><th>Seite 2 – HINTEN</th><td>Druckfläche 300 × 380 mm, mittig, Oberkante 10 cm unter dem Kragenansatz. Motiv komplett: Frage, QR-Code mit Pfeil, Zeile, Wortmarke.</td></tr>
    <tr><th>QR-Code</th><td>Ziel: <b>{url}</b> — Kachel nicht verkleinern, nicht spiegeln, nicht invertieren, keine Farbänderung. Vor dem Druck einmal vom Andruck scannen (Ergebnis: Standort-Check-Seite).</td></tr>
    <tr><th>Verfahren</th><td>Vektordaten (PDF, Schriften eingebettet). Empfehlung: Siebdruck oder DTF (drei Farben + QR-Kachel); bei Flex Marke und Wortmarke einfarbig Hell, QR-Kachel als helle Fläche mit schwarzen Modulen aus dem Polo-Grund lösen.</td></tr>
    <tr><th>Stück</th><td>1 (je Vertriebler ein eigener QR-Code – Dateien NICHT vertauschen)</td></tr>
    <tr><th>Auftraggeber</th><td>GreenCareers GmbH · Hansaring 61 · 50670 Köln · Ansprechpartnerin Jana Heinlein</td></tr>
    <tr><th>Termin</th><td>Lieferung bis Montag, 14. September 2026 (Messe 15.–18.09.2026, Nürnberg)</td></tr>
  </table>
  <p class="note">Dieses Blatt gehört zur Datei polo-{person["slug"]}.pdf (Seite 1 + 2 = Druckmotive). Rückfragen: redaktion@galabau-kompass.de</p>
</section>'''

CSS = f'''
@font-face{{font-family:'Plus Jakarta Sans';src:url('file://{ROOT}/assets/fonts/jakarta-var.woff2') format('woff2');font-weight:200 800;font-style:normal;}}
@font-face{{font-family:'Plus Jakarta Sans';src:url('file://{ROOT}/assets/fonts/jakarta-italic.woff2') format('woff2');font-weight:200 800;font-style:italic;}}
@font-face{{font-family:'Inter';src:url('file://{ROOT}/assets/fonts/inter-var.woff2') format('woff2');font-weight:400 800;}}
*{{margin:0;padding:0;box-sizing:border-box;}}
html,body{{background:#fff;}}
.page{{page-break-after:always;position:relative;overflow:hidden;font-family:Inter,sans-serif;}}
.front,.back{{background:{BLACK};color:{CREME};display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center;padding:14mm 10mm 12mm;position:relative;}}
.front{{justify-content:center;gap:5mm;padding:4mm;}}
.front .marke .mark{{height:60mm;width:auto;}}
.word.klein{{font-size:7.8mm;white-space:nowrap;}}
.frage{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;letter-spacing:-.03em;font-size:19mm;line-height:1.05;}}
.pfeil{{position:absolute;right:26mm;top:44mm;width:64mm;height:auto;transform:rotate(-6deg);}}
.unten{{display:flex;flex-direction:column;align-items:center;gap:5mm;}}
.unten .logo .mark{{height:16mm;}}
.unten .word{{font-size:16mm;}}
.top{{display:flex;flex-direction:column;align-items:center;gap:4mm;}}
.eyebrow{{font-size:4.2mm;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:{HONIG};}}
.back .eyebrow{{font-size:5mm;}}
.logo{{display:flex;align-items:center;gap:6mm;}}
.mark{{height:22mm;width:auto;}}
.back .mark{{height:28mm;}}
.word{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;letter-spacing:-.03em;font-size:22mm;letter-spacing:-.02em;line-height:1;}}
.back .word{{font-size:27mm;}}
.word i{{font-style:italic;color:{HONIG};}}
.tagline{{font-size:4mm;letter-spacing:.2em;text-transform:uppercase;color:rgba(244,241,232,.65);}}
.back .tagline{{font-size:4.8mm;}}
.qrwrap{{background:{CREME};border-radius:8mm;padding:8mm;display:flex;align-items:center;justify-content:center;}}
.qrwrap svg{{width:100%;height:100%;display:block;}}
.arrow{{font-size:22mm;line-height:.9;color:{HONIG};font-weight:800;margin-top:-2mm;}}
.line1{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;letter-spacing:-.03em;font-size:14mm;line-height:1.05;letter-spacing:-.01em;}}
.back .line1{{font-size:17mm;}}
.line2{{font-size:8.2mm;line-height:1.25;color:{HONIG};font-weight:700;margin-top:3mm;}}
.back .line2{{font-size:9.6mm;}}
.foot{{font-size:3.6mm;letter-spacing:.12em;text-transform:uppercase;color:rgba(244,241,232,.55);margin-top:4mm;}}
.spec{{padding:18mm 16mm;color:#0B1F14;font-size:3.8mm;line-height:1.5;}}
.spec h1{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;letter-spacing:-.03em;font-size:8mm;margin-bottom:8mm;}}
.spec table{{width:100%;border-collapse:collapse;}}
.spec th,.spec td{{text-align:left;vertical-align:top;padding:2.6mm 3mm;border-bottom:.3mm solid #E5E1D6;}}
.spec th{{width:38mm;font-size:3mm;letter-spacing:.1em;text-transform:uppercase;color:#4B5A50;}}
.spec .note{{margin-top:8mm;color:#4B5A50;font-size:3.3mm;}}
'''

def build(person: dict, size: str, domain: str, outdir: str) -> dict:
    url = f"https://{domain}/s/{person['slug']}/"
    html = f'''<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>Polo {person["name"]}</title>
<style>{CSS}@page{{margin:0;}}</style></head><body>
{page("front", person, url, 90, 100)}
{page("back", person, url, 300, 380)}
{spec(person, size, url)}
</body></html>'''
    os.makedirs(outdir, exist_ok=True)
    work = os.path.join(ROOT, "print", "_work"); os.makedirs(work, exist_ok=True)
    src = os.path.join(work, f"polo-{person['slug']}.html")
    open(src, "w", encoding="utf-8").write(html)
    pdf = os.path.join(outdir, f"polo-{person['slug']}.pdf")
    # Chrome druckt jede Section mit ihrer eigenen Größe? Nein – @page size ist global.
    # Deshalb je Seite eine eigene Datei mit passender @page-Größe, dann zusammenfügen.
    parts = []
    for kind, (w, h) in {"front": (90, 100), "back": (300, 380), "spec": (210, 297)}.items():
        one = html.replace("@page{margin:0;}", f"@page{{size:{w}mm {h}mm;margin:0;}}")
        # nur die gewünschte Section behalten
        import re
        secs = re.findall(r"<section class=\"page [^>]*>.*?</section>", one, flags=re.S)
        keep = [s for s in secs if f'class="page {kind}"' in s][0]
        one = re.sub(r"<body>.*</body>", "<body>" + keep.replace("page-break-after:always;", "") + "</body>", one, flags=re.S)
        p = os.path.join(work, f"polo-{person['slug']}-{kind}.html"); open(p, "w", encoding="utf-8").write(one)
        out = os.path.join(work, f"polo-{person['slug']}-{kind}.pdf")
        subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--allow-file-access-from-files", "--no-pdf-header-footer", "--virtual-time-budget=4000", f"--print-to-pdf={out}", f"file://{p}"], check=True, capture_output=True, timeout=120)
        png = os.path.join(outdir, f"polo-{person['slug']}-{kind}.png")
        subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", "--virtual-time-budget=4000", f"--window-size={int(w*3.78)},{int(h*3.78)}", f"--screenshot={png}", f"file://{p}"], check=True, capture_output=True, timeout=120)
        parts.append(out)
    import fitz
    doc = fitz.open()
    for p in parts: doc.insert_pdf(fitz.open(p))
    doc.save(pdf); doc.close()
    return {"slug": person["slug"], "name": person["name"], "size": size, "url": url, "pdf": pdf}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--domain", default="galabau-kompass.de")
    ap.add_argument("--size", action="append", default=[], help="slug=GRÖSSE, z. B. niklas=XL")
    ap.add_argument("--only", default=None)
    a = ap.parse_args()
    sizes = dict(s.split("=", 1) for s in a.size)
    results = []
    for p in PEOPLE:
        if a.only and p["slug"] != a.only: continue
        r = build(p, sizes.get(p["slug"], "___ (bitte eintragen)"), a.domain, os.path.join(ROOT, "print", p["slug"]))
        results.append(r); print("✓", r["name"], "→", os.path.relpath(r["pdf"], ROOT))
    json.dump(results, open(os.path.join(ROOT, "print", "manifest.json"), "w"), indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()
