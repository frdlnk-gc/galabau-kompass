#!/usr/bin/env python3
"""Messe-Visitenkarten GaLaBau 2026 · GreenCareers × GaLaBau Kompass.

Absender ist GreenCareers, weil der Rückruf um Mitarbeitergewinnung geht. Die Rückseite erklärt
den Bruch, den der Besucher am Stand erlebt hat: Er sprach mit jemandem im Kompass-Polo.

Gestaltungsregeln (nach Freddys Kritik 07.09.: „nicht hochwertig", „Logo verzogen"):
  · Das Logo hat ein festes Seitenverhältnis von 1,795 : 1. Breite UND Höhe werden immer zusammen
    gesetzt, dazu object-fit:contain und align-self:flex-start – in einem Flex-Container zieht
    align-items:stretch ein <img> sonst auf Containerbreite und verzerrt es.
  · Ruhe vor Größe: kleiner Satz, viel Weißraum, eine Akzentfarbe, keine dicken Farbkanten.
  · Optischer Rand: 9 mm ringsum, unten etwas mehr – wirkt gedruckt ausgewogener als exakt gleich.

Format 85 × 55 mm plus 3 mm Beschnitt → 91 × 61 mm Enddatei.
Aufruf:
  python3 tools/visitenkarten.py                    → drei Entwürfe + Vergleichsblatt
  python3 tools/visitenkarten.py --final --entwurf=2 → Druck-PDFs für alle fünf
"""
import base64, io, os, subprocess, sys
import segno
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT = os.path.join(ROOT, "print", "visitenkarten"); os.makedirs(OUT, exist_ok=True)
ASSETS = os.path.join(ROOT, "print", "_assets")

GRUEN, LIME, CREME, INK, GRAU = "#0B3D24", "#CDF47A", "#F2F7F3", "#0E1B13", "#6B7B71"
LOGO_V = 1.795          # Seitenverhältnis des freigestellten GreenCareers-Logos

# Mobilnummern und Adressen (Freddy, 07.09.). E-Mail immer vorname.nachname@green-careers.de.
PERSONEN = [
    {"vorname": "Nick",   "nachname": "Scheffler", "rolle": "Partnerbetreuung", "mail": "nick.scheffler@green-careers.de",  "tel": "+49 170 5988931"},
    {"vorname": "Fabio",  "nachname": "Zindel",    "rolle": "Partnerbetreuung", "mail": "fabio.zindel@green-careers.de",    "tel": "+49 175 4143756"},
    {"vorname": "Niklas", "nachname": "Kühme",     "rolle": "Partnerbetreuung", "mail": "niklas.kuehme@green-careers.de",   "tel": "+49 170 1260762"},
    {"vorname": "Julian", "nachname": "Kohansal",  "rolle": "Vertriebsleitung", "mail": "julian.kohansal@green-careers.de", "tel": "+49 176 87302035"},
    {"vorname": "Liam",   "nachname": "Quick",     "rolle": "Vertrieb",         "mail": "liam.quick@green-careers.de",      "tel": "+49 176 20345311"},
]

def b64(pfad):
    return "data:image/png;base64," + base64.b64encode(open(pfad, "rb").read()).decode()

GC_DUNKEL = b64(os.path.join(ASSETS, "gc-dunkel.png"))
GC_HELL   = b64(os.path.join(ASSETS, "gc-hell.png"))

def logo(hell: bool, breite_mm: float) -> str:
    """Logo mit fest gerechneter Höhe – nie gestreckt, nie gequetscht."""
    h = round(breite_mm / LOGO_V, 2)
    quelle = GC_HELL if hell else GC_DUNKEL
    return f'<img class="gc" src="{quelle}" alt="GreenCareers" style="width:{breite_mm}mm;height:{h}mm">'

def nadel(h_mm: float, auf_dunkel: bool) -> str:
    grund = "rgba(242,247,243,.13)" if auf_dunkel else GRUEN
    return (f'<svg viewBox="0 0 64 64" style="width:{h_mm}mm;height:{h_mm}mm;flex:none">'
            f'<rect width="64" height="64" rx="14" fill="{grund}"/>'
            f'<path d="M32 3.25 44.075 32 32 25.675 19.925 32Z" fill="{LIME}"/>'
            f'<path d="M32 60.75 19.925 32 32 38.325 44.075 32Z" fill="{CREME}"/></svg>')

def qr(url: str, farbe: str) -> str:
    q = segno.make(url, error="m"); buf = io.BytesIO()
    q.save(buf, kind="svg", xmldecl=False, svgns=True, scale=10, border=0, dark=farbe, light=None,
           svgclass=None, lineclass=None, omitsize=True)
    return buf.getvalue().decode()

CSS = f"""
@font-face{{font-family:'Plus Jakarta Sans';src:url('file://{ROOT}/assets/fonts/jakarta-var.woff2') format('woff2');font-weight:200 800;}}
@font-face{{font-family:'Inter';src:url('file://{ROOT}/assets/fonts/inter-var.woff2') format('woff2');font-weight:400 700;}}
*{{margin:0;padding:0;box-sizing:border-box}}
@page{{size:91mm 61mm;margin:0}}
.karte{{width:91mm;height:61mm;position:relative;overflow:hidden;page-break-after:always;
        font-family:Inter,sans-serif;display:flex;flex-direction:column}}
/* Ein Bild in einem Flex-Container wird sonst auf Containerbreite gestreckt. */
.gc{{object-fit:contain;align-self:flex-start;display:block;flex:none}}
.name{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;letter-spacing:-.02em;line-height:1.1}}
.rolle{{font-family:Inter,sans-serif;font-weight:500;letter-spacing:.1em;text-transform:uppercase}}
.daten{{font-weight:400;white-space:nowrap}}
.daten b{{font-weight:600}}
.kmarke{{display:flex;align-items:center;gap:2.6mm}}
.kword{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;letter-spacing:-.02em}}
.qrbox svg{{display:block;width:100%;height:100%}}

/* ── 1 · Ruhig ──────────────────────────────────────────────────────────
   Weiße Karte, ein feiner Strich, sonst nichts. Die Angaben stehen unten
   in einer Zeile. Die teuerste Wirkung entsteht durch das, was fehlt.    */
.a-v{{background:#FFFFFF;color:{INK};padding:9mm 9mm 9.5mm;justify-content:space-between}}
.a-v .name{{font-size:5.5mm;margin-bottom:1.4mm}}
.a-v .rolle{{font-size:2.6mm;color:{GRAU}}}

.a-v .daten{{font-size:2.85mm;line-height:1.6;color:#3C4C42}}
.a-h{{background:{GRUEN};color:{CREME};align-items:center;justify-content:center;gap:3mm;text-align:center}}
.a-h .kword{{font-size:5.4mm}}
.a-h .zusatz{{font-size:2.6mm;letter-spacing:.1em;text-transform:uppercase;color:{LIME};font-weight:600}}
.a-h .fuss{{position:absolute;left:0;right:0;bottom:6mm;font-size:2.35mm;color:rgba(242,247,243,.55)}}

/* ── 2 · Dunkel ─────────────────────────────────────────────────────────
   Vorderseite grün, Angaben hell und klein. Fällt im Kartenstapel auf,
   ohne laut zu sein. Rückseite hell, damit die Marke atmet.              */
.b-v{{background:{GRUEN};color:{CREME};padding:9mm 9mm 9.5mm;justify-content:space-between}}
.b-v .name{{font-size:5.5mm;color:#FFFFFF;margin-bottom:1.4mm}}
.b-v .rolle{{font-size:2.6mm;color:{LIME}}}

.b-v .daten{{font-size:2.85mm;line-height:1.6;color:rgba(242,247,243,.86)}}
.b-h{{background:{CREME};color:{INK};padding:9mm 9mm 9.5mm;justify-content:space-between}}
.b-h .kword{{font-size:5mm;color:{GRUEN}}}
.b-h .satz{{font-size:3.1mm;line-height:1.5;color:#3C4C42;max-width:50mm}}
.b-h .unten{{display:flex;align-items:flex-end;justify-content:space-between;gap:5mm}}
.b-h .adressen{{font-size:2.9mm;line-height:1.65;color:{INK};font-weight:500}}
.b-h .adressen span{{color:{GRAU};font-weight:400}}
.b-h .qrbox{{width:14mm;height:14mm;flex:none}}

/* ── 3 · Zweispaltig ────────────────────────────────────────────────────
   Zwei Spalten auf einer Grundlinie, getrennt durch eine Haarlinie.
   Wirkt geordnet wie ein Briefkopf, ohne Farbfläche.                     */
.c-v{{background:#FFFFFF;color:{INK};padding:9mm 9mm 9.5mm;align-items:center;text-align:center;justify-content:space-between}}
.c-v .gc{{align-self:center}}
.c-v .name{{font-size:5.5mm;margin-bottom:1.4mm}}
.c-v .rolle{{font-size:2.6mm;color:{GRAU}}}
.c-v .strich{{width:12mm;height:.4mm;background:{LIME};margin:0 auto}}
.c-v .daten{{font-size:2.8mm;line-height:1.6;color:#3C4C42}}
.c-h{{background:{GRUEN};color:{CREME};padding:10mm 9mm 9mm;justify-content:space-between}}
.c-h .kword{{font-size:5mm}}
.c-h .satz{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:4.6mm;line-height:1.25;letter-spacing:-.02em}}
.c-h .satz span{{color:{LIME}}}
.c-h .unten{{display:flex;align-items:flex-end;justify-content:space-between;gap:5mm}}
.c-h .fuss{{font-size:2.35mm;line-height:1.5;color:rgba(242,247,243,.55)}}
.c-h .qrbox{{width:13mm;height:13mm;flex:none}}
"""

MAGAZIN = "https://galabau-kompass.de/"

def karte(p: dict, entwurf: str) -> str:
    name = f'{p["vorname"]} {p["nachname"]}'
    daten = f'<b>{p["tel"]}</b><br>{p["mail"]}'

    if entwurf == "1":
        return f'''
<section class="karte a-v">
  {logo(False, 23)}
  <div>
    <div class="name">{name}</div>
    <div class="rolle">{p["rolle"]}</div>
  </div>
  <div class="daten">{daten}</div>
</section>
<section class="karte a-h">
  <div class="kmarke">{nadel(7.5, True)}<div class="kword">GaLaBau Kompass</div></div>
  <div class="zusatz">GaLaBau 2026 Nürnberg</div>
  <div class="fuss">Das Magazin für den Garten- und Landschaftsbau.<br>Eine Marke der GreenCareers GmbH, Köln.</div>
</section>'''

    if entwurf == "2":
        return f'''
<section class="karte b-v">
  {logo(True, 23)}
  <div>
    <div class="name">{name}</div>
    <div class="rolle">{p["rolle"]}</div>
  </div>
  <div class="daten">{daten}</div>
</section>
<section class="karte b-h">
  <div class="kmarke">{nadel(7.5, False)}<div class="kword">GaLaBau Kompass</div></div>
  <div class="satz">Das Magazin für den Garten- und Landschaftsbau.</div>
  <div class="unten">
    <div class="adressen">galabau-kompass.de<br><span>green-careers.de</span></div>
    <div class="qrbox">{qr(MAGAZIN, GRUEN)}</div>
  </div>
</section>'''

    return f'''
<section class="karte c-v">
  {logo(False, 23)}
  <div>
    <div class="name">{name}</div>
    <div class="rolle">{p["rolle"]}</div>
  </div>
  <div class="strich"></div>
  <div class="daten">{daten}</div>
</section>
<section class="karte c-h">
  <div class="kmarke">{nadel(7.5, True)}<div class="kword">GaLaBau Kompass</div></div>
  <div class="satz">Nachrichten, Zahlen und<br>Vorlagen für <span>GaLaBau-Betriebe</span></div>
  <div class="unten">
    <div class="fuss">galabau-kompass.de<br>Eine Marke der GreenCareers GmbH, Köln</div>
    <div class="qrbox">{qr(MAGAZIN, CREME)}</div>
  </div>
</section>'''

def chrome(args, timeout=90):
    for versuch in range(3):
        try: subprocess.run(args, check=True, capture_output=True, timeout=timeout); return
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError):
            if versuch == 2: raise

def bauen(p, entwurf, pdf_ziel=None):
    work = os.path.join(ROOT, "print", "_work"); os.makedirs(work, exist_ok=True)
    slug = p["vorname"].lower()
    html = f'<!DOCTYPE html><html><head><meta charset="UTF-8"><style>{CSS}</style></head><body>{karte(p, entwurf)}</body></html>'
    src = os.path.join(work, f"vk-{slug}-{entwurf}.html"); open(src, "w", encoding="utf-8").write(html)
    if pdf_ziel:
        chrome([CHROME, "--headless=new", "--disable-gpu", "--allow-file-access-from-files", "--no-pdf-header-footer",
                "--virtual-time-budget=4000", f"--print-to-pdf={pdf_ziel}", f"file://{src}"])
    png = os.path.join(work, f"vk-{slug}-{entwurf}.png")
    chrome([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
            "--virtual-time-budget=4000", f"--window-size={int(91*3.78)},{int(61*3.78*2)}", f"--screenshot={png}", f"file://{src}"])
    return png

def main():
    final = "--final" in sys.argv
    gewaehlt = next((a.split("=")[1] for a in sys.argv if a.startswith("--entwurf=")), "1")
    if final:
        for p in PERSONEN:
            pdf = os.path.join(OUT, f"visitenkarte-{p['vorname'].lower()}.pdf")
            bauen(p, gewaehlt, pdf)
            print(f"✓ {p['vorname']} {p['nachname']}  →  {os.path.relpath(pdf, ROOT)}")
        return
    muster = [x for x in PERSONEN if x["vorname"] == "Niklas"][0]   # längster Name, längste Adresse
    seiten = []
    for e in ("1", "2", "3"):
        png = bauen(muster, e, os.path.join(OUT, f"entwurf-{e}.pdf"))
        im = Image.open(png).convert("RGB"); h = im.height // 2
        seiten.append((im.crop((0, 0, im.width, h)), im.crop((0, h, im.width, h * 2))))
        print(f"✓ Entwurf {e}")
    b, hh = seiten[0][0].size
    rand, luecke = 44, 30
    blatt = Image.new("RGB", (b * 2 + luecke + rand * 2, (hh + luecke) * 3 + rand * 2 - luecke), "#E4E9E6")
    for i, (v, r) in enumerate(seiten):
        y = rand + i * (hh + luecke)
        blatt.paste(v, (rand, y)); blatt.paste(r, (rand + b + luecke, y))
    blatt.save(os.path.join(OUT, "entwuerfe.jpg"), quality=92, optimize=True)
    print("✓ print/visitenkarten/entwuerfe.jpg")

if __name__ == "__main__":
    main()
