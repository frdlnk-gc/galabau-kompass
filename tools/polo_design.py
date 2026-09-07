#!/usr/bin/env python3
"""
GaLaBau Kompass · Polo-Designvorschläge (Messe GaLaBau 2026)

Legt drei Druckvarianten (A Doppelt · B Klassisch · C Reduziert) als Vorschau
auf das Blanko-Polo (print/_mockup/polo-front.png, polo-back.png, per gpt-image-2)
und schreibt print/design/polo-designvorschlaege.pdf (Übersicht, je Variante eine
Seite mit Vorder-/Rückansicht und Druckangaben, Größenliste) plus PNG-Vorschauen.

Aufruf: python3 tools/polo_design.py [--domain galabau-kompass.de]
"""
import argparse, io, os, re, subprocess
import segno
from PIL import Image, ImageChops, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
MOCK = os.path.join(ROOT, "print", "_mockup")
OUT = os.path.join(ROOT, "print", "design"); os.makedirs(OUT, exist_ok=True)
WORK = os.path.join(OUT, "_work"); os.makedirs(WORK, exist_ok=True)
LIGHT, GREEN, LIME, BLACK = "#F2F7F3", "#23A551", "#CDF47A", "#000000"
PX_MM = 3.78          # Render-Auflösung der Druckmotive (96 dpi)
MOCK_PX_CM = 12.9     # Mockup: Rumpfbreite ≈ 56 cm ≙ 720 px
from polo_print import PFEIL  # Pfeil-Geometrie zentral in polo_print.py (hängt am Fragezeichen)



MARK = '<svg class="mark" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29" fill="none" stroke="{ink}" stroke-width="2.4"/><path d="M32 7 42.5 32 32 26.5 21.5 32Z" fill="{accent}"/><path d="M32 57 21.5 32 32 37.5 42.5 32Z" fill="{ink}"/></svg>'

def qr_svg(url):
    q = segno.make(url, error="h"); buf = io.BytesIO()
    q.save(buf, kind="svg", xmldecl=False, svgns=True, scale=10, border=0, dark=BLACK, light=None, svgclass=None, lineclass=None, omitsize=True)
    return buf.getvalue().decode("utf-8")

CSS = f'''
@font-face{{font-family:'Plus Jakarta Sans';src:url('file://{ROOT}/assets/fonts/jakarta-var.woff2') format('woff2');font-weight:200 800;}}
@font-face{{font-family:'Inter';src:url('file://{ROOT}/assets/fonts/inter-var.woff2') format('woff2');font-weight:400 800;}}
*{{margin:0;padding:0;box-sizing:border-box;}}
html,body{{background:{BLACK};}}
.art{{background:{BLACK};color:{LIGHT};font-family:Inter,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;overflow:hidden;}}
.eyebrow{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:{LIME};}}
.logo{{display:flex;align-items:center;gap:.28em;}}
.mark{{height:1em;width:auto;}}
.word{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;letter-spacing:-.035em;line-height:1;white-space:nowrap;}}
.tagline{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(242,247,243,.7);}}
.qrwrap{{background:{LIGHT};border-radius:8mm;padding:7mm;display:flex;align-items:center;justify-content:center;}}
.qrwrap svg{{width:100%;height:100%;display:block;}}
.arrow{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;color:{LIME};line-height:.9;}}
.line1{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;letter-spacing:-.03em;line-height:1.05;}}
.fz{{position:relative;display:inline-block;}}
.pfeil{{position:absolute;left:calc(100% - 14mm);top:0;width:52mm;height:70mm;overflow:visible;}}
.line2{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;line-height:1.25;color:{LIME};}}
.foot{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(242,247,243,.6);}}
'''

def motiv_voll(url, w, h, groß):
    """Komplettes Motiv (Logo, QR, Standort-Check-Zeilen) – Variante A vorn/hinten, B hinten."""
    qr = 170 if groß else 128; ey = 5 if groß else 4.2; word = 27 if groß else 22; l1 = 17 if groß else 14; l2 = 9.6 if groß else 8.2
    return f'''<section class="art" style="width:{w}mm;height:{h}mm;padding:12mm 10mm;justify-content:space-between;">
  <div style="display:flex;flex-direction:column;align-items:center;gap:4mm;">
    <div class="eyebrow" style="font-size:{ey}mm;">Branchenumfrage 2026 · Mitarbeitergewinnung im GaLaBau</div>
    <div class="logo" style="font-size:{word}mm;">{MARK.format(ink=LIGHT, accent=LIME)}<div class="word">GaLaBau Kompass</div></div>
    <div class="tagline" style="font-size:{4.6 if groß else 4}mm;">Das Magazin für den Garten- und Landschaftsbau</div>
  </div>
  <div class="qrwrap" style="width:{qr}mm;height:{qr}mm;">{qr_svg(url)}</div>
  <div class="arrow" style="font-size:{20 if groß else 17}mm;">↑</div>
  <div class="line1" style="font-size:{l1}mm;">Standort-Check<br>für GaLaBau-Betriebe</div>
  <div class="line2" style="font-size:{l2}mm;margin-top:2mm;">Wie viele Fachkräfte gibt es bei Ihnen?<br>Kostenlos scannen.</div>
  <div class="foot" style="font-size:3.8mm;margin-top:3mm;">galabau-kompass.de</div>
</section>'''

def motiv_brust(w, h):
    """Brustlogo links (Variante B): Marke + Wortmarke, darunter Claim."""
    return f'''<section class="art" style="width:{w}mm;height:{h}mm;align-items:flex-start;text-align:left;gap:2.2mm;">
  <div class="logo" style="font-size:10.5mm;">{MARK.format(ink=LIGHT, accent=LIME)}<div class="word">GaLaBau Kompass</div></div>
  <div class="tagline" style="font-size:2.7mm;padding-left:1mm;">Das Magazin für den Garten- und Landschaftsbau</div>
</section>'''

def motiv_marke(w, h):
    """Variante C vorn: Marke, darunter klein die Wortmarke."""
    mark = MARK.format(ink=LIGHT, accent=LIME).replace('class="mark"', 'class="mark" style="height:60mm;width:auto"')
    return f'''<section class="art" style="width:{w}mm;height:{h}mm;gap:5mm;">{mark}<div class="word" style="font-size:8.6mm;">GaLaBau Kompass</div></section>'''

def motiv_reduziert(url, w, h):
    """Rücken Variante C: Frage, QR groß mit handgezeichnetem Pfeil, Zeile, Wortmarke."""
    return f'''<section class="art" style="width:{w}mm;height:{h}mm;padding:14mm 12mm;justify-content:flex-start;position:relative;">
  <div class="line1" style="font-size:19mm;">Wie viele Fachkräfte<br>gibt es bei Ihnen<span class="fz">?{PFEIL.format(accent=LIME)}</span></div>
  <div style="position:relative;width:100%;height:52mm;flex:none;"></div>
  <div class="qrwrap" style="width:186mm;height:186mm;">{qr_svg(url)}</div>
  <div style="display:flex;flex-direction:column;align-items:center;gap:5mm;margin-top:auto;">
    <div class="line2" style="font-size:10.5mm;">Kostenlos scannen · Standort-Check</div>
    <div class="logo" style="font-size:16mm;">{MARK.format(ink=LIGHT, accent=LIME)}<div class="word">GaLaBau Kompass</div></div>
    <div class="foot" style="font-size:3.8mm;">galabau-kompass.de</div>
  </div>
</section>'''

def render(name, html, w_mm, h_mm):
    src = os.path.join(WORK, name + ".html")
    open(src, "w", encoding="utf-8").write(f'<!DOCTYPE html><html><head><meta charset="UTF-8"><style>{CSS}</style></head><body>{html}</body></html>')
    png = os.path.join(WORK, name + ".png")
    cmd = [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", "--virtual-time-budget=4000",
           f"--window-size={int(w_mm * PX_MM)},{int(h_mm * PX_MM)}", f"--screenshot={png}", f"file://{src}"]
    for versuch in range(3):  # Chrome hängt gelegentlich → Zeitlimit + Wiederholung
        try:
            subprocess.run(cmd, check=True, capture_output=True, timeout=90); break
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError):
            if versuch == 2: raise
    return Image.open(png).convert("RGB")

def auflegen(mock, art, w_cm, top_px, cx=512):
    """Motiv (auf Schwarz gerendert) per Aufhellen auf das Polo legen – Stoffstruktur bleibt sichtbar."""
    w = int(w_cm * MOCK_PX_CM); h = int(art.height * w / art.width)
    art = art.resize((w, h), Image.LANCZOS)
    x0 = int(cx - w / 2); box = (x0, top_px, x0 + w, top_px + h)
    region = mock.crop(box)
    # leichte Stoffwelligkeit: Motiv mit dem Helligkeitsverlauf des Stoffs multiplizieren
    lum = region.convert("L").filter(ImageFilter.GaussianBlur(6))
    lum = lum.point(lambda v: min(255, int(180 + v * 0.6)))
    art = ImageChops.multiply(art, Image.merge("RGB", (lum, lum, lum)))
    mock.paste(ImageChops.lighter(region, art), box)
    return mock

def variante(key, url):
    front = Image.open(os.path.join(MOCK, "polo-front.png")).convert("RGB")
    back = Image.open(os.path.join(MOCK, "polo-back.png")).convert("RGB")
    if key == "A":
        auflegen(front, render("A-front", motiv_voll(url, 250, 300, False), 250, 300), 25, 560)
        auflegen(back, render("A-back", motiv_voll(url, 300, 380, True), 300, 380), 30, 430)
    elif key == "B":
        auflegen(front, render("B-front", motiv_brust(120, 32), 120, 32), 12, 600, cx=640)
        auflegen(back, render("B-back", motiv_voll(url, 300, 380, True), 300, 380), 30, 430)
    else:
        auflegen(front, render("C-front", motiv_marke(90, 100), 90, 100), 9, 575, cx=640)
        auflegen(back, render("C-back", motiv_reduziert(url, 300, 380), 300, 380), 30, 430)
    fp = os.path.join(OUT, f"variante-{key}-vorne.jpg"); bp = os.path.join(OUT, f"variante-{key}-hinten.jpg")
    front.save(fp, quality=86, optimize=True); back.save(bp, quality=86, optimize=True)
    both = Image.new("RGB", (front.width * 2 + 40, front.height), (236, 238, 236))
    both.paste(front, (0, 0)); both.paste(back, (front.width + 40, 0))
    both.save(os.path.join(OUT, f"variante-{key}.jpg"), quality=88)
    return fp, bp

VARIANTEN = {
    "A": ("Doppelt", "Vorne und hinten das komplette Motiv: Logo, QR-Code und die Standort-Check-Zeilen. Von vorn und von hinten scannbar – am lautesten, ideal in vollen Hallen und in der Schlange.",
          [("Vorne", "Komplettes Motiv 25 × 30 cm, mittig, Oberkante ca. 3 cm unter der Knopfleiste"), ("Hinten", "Komplettes Motiv 30 × 38 cm, mittig, Oberkante 10 cm unter dem Kragenansatz"), ("Farben", "Hell #F2F7F3 · Grün #23A551 (Nadel) · Lime #CDF47A (Zeilen, Pfeil) · QR-Kachel hell mit schwarzen Modulen")]),
    "B": ("Klassisch", "Vorne ein Brustlogo links wie bei einem Firmenpolo, hinten das große Motiv mit QR-Code. Wirkt von vorn seriös, von hinten fordert es zum Scannen auf – die Variante mit dem besten Verhältnis aus Auftreten und Wirkung.",
          [("Vorne", "Brustlogo links 12 × 3,5 cm (Marke + Wortmarke, darunter Claim), auf Höhe der untersten Knopfleiste"), ("Hinten", "Komplettes Motiv 30 × 38 cm, mittig, Oberkante 10 cm unter dem Kragenansatz"), ("Farben", "Hell #F2F7F3 · Grün #23A551 · Lime #CDF47A · QR-Kachel hell mit schwarzen Modulen")]),
    "C": ("Reduziert", "Vorne die Kompassnadel mit der Wortmarke darunter, hinten die Frage „Wie viele Fachkräfte gibt es bei Ihnen?“, der große QR-Code mit handgezeichnetem Pfeil und die Wortmarke. Ruhig, hochwertig, wenig Text – die Frage ist der Aufhänger fürs Gespräch.",
          [("Vorne", "Brustlogo links: Marke 6 cm, darunter Wortmarke, Druckfläche 9 × 10 cm, auf Höhe des untersten Knopfs"), ("Hinten", "Frage, QR 19 cm mit Edding-Pfeil, Zeile „Kostenlos scannen · Standort-Check“, Wortmarke – Fläche 30 × 38 cm, Oberkante 10 cm unter dem Kragenansatz"), ("Farben", "Hell #F2F7F3 · Grün #23A551 (Nadel) · Lime #CDF47A (Pfeil, Zeile) · QR-Kachel hell mit schwarzen Modulen")]),
}
GROESSEN = [("Fabio Zindel", "Vertrieb, Messe", ""), ("Niklas Kühme", "Vertrieb, Messe", ""), ("Nick Scheffler", "Vertrieb, Messe", ""), ("Julian Kohansal", "Geschäftsführung (optional)", ""), ("Liam Quick", "Geschäftsführung (optional)", "")]

PDF_CSS = f'''
@font-face{{font-family:'Plus Jakarta Sans';src:url('file://{ROOT}/assets/fonts/jakarta-var.woff2') format('woff2');font-weight:200 800;}}
@font-face{{font-family:'Inter';src:url('file://{ROOT}/assets/fonts/inter-var.woff2') format('woff2');font-weight:400 800;}}
@page{{size:A4 landscape;margin:0;}}
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{font-family:Inter,sans-serif;color:#0E1B13;font-size:10pt;line-height:1.5;}}
.p{{width:297mm;height:210mm;padding:14mm 16mm;page-break-after:always;position:relative;overflow:hidden;}}
.p:last-child{{page-break-after:auto;}}
.kopf{{display:flex;justify-content:space-between;align-items:center;border-bottom:.4mm solid #DDE7E0;padding-bottom:3mm;margin-bottom:6mm;}}
.marke{{display:flex;align-items:center;gap:3mm;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:12pt;letter-spacing:-.03em;}}
.marke svg{{width:8mm;height:8mm;}}
.kick{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:7.5pt;letter-spacing:.14em;text-transform:uppercase;color:#15803D;}}
h1{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:22pt;letter-spacing:-.03em;line-height:1.08;}}
h2{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:15pt;letter-spacing:-.025em;margin-bottom:2mm;}}
.dek{{font-size:10.5pt;color:#3C4C42;max-width:180mm;margin-top:2mm;}}
.drei{{display:grid;grid-template-columns:repeat(3,1fr);gap:8mm;margin-top:8mm;}}
.karte{{background:#F3F8F4;border-radius:5mm;padding:5mm;}}
.karte img{{width:100%;border-radius:3mm;display:block;}}
.karte .t{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:11pt;margin-top:3mm;}}
.karte .s{{font-size:8.6pt;color:#3C4C42;margin-top:1mm;}}
.var{{display:grid;grid-template-columns:1.25fr 1fr;gap:10mm;align-items:start;}}
.bilder{{display:grid;grid-template-columns:1fr 1fr;gap:5mm;}}
.bilder img{{width:100%;border-radius:4mm;display:block;}}
.bilder .l{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:8pt;letter-spacing:.1em;text-transform:uppercase;color:#6B7B71;margin-top:2mm;text-align:center;}}
.spec{{margin-top:5mm;}}
.spec th,.spec td{{text-align:left;vertical-align:top;padding:2mm 2.4mm;border-bottom:.25mm solid #DDE7E0;font-size:9pt;}}
.spec th{{width:24mm;font-family:'Plus Jakarta Sans',sans-serif;font-size:7pt;letter-spacing:.1em;text-transform:uppercase;color:#6B7B71;}}
.spec table{{width:100%;border-collapse:collapse;}}
.hin{{background:#EAF6EE;border-radius:3mm;padding:3.5mm 4.5mm;font-size:9pt;margin-top:5mm;}}
.hin b{{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:7pt;letter-spacing:.12em;text-transform:uppercase;color:#15803D;margin-bottom:1mm;}}
.g table{{width:100%;border-collapse:collapse;margin-top:5mm;font-size:10pt;}}
.g th,.g td{{text-align:left;padding:3mm 3mm;border-bottom:.3mm solid #DDE7E0;}}
.g th{{font-family:'Plus Jakarta Sans',sans-serif;font-size:7.5pt;letter-spacing:.1em;text-transform:uppercase;color:#6B7B71;background:#F3F8F4;}}
.g td.feld{{height:11mm;width:40mm;border-bottom:.4mm solid #9AA9A0;}}
.fuss{{position:absolute;left:16mm;right:16mm;bottom:8mm;display:flex;justify-content:space-between;font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:7.5pt;letter-spacing:.1em;text-transform:uppercase;color:#6B7B71;}}
'''
LOGO = '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="29" fill="none" stroke="#0E1B13" stroke-width="2.4"/><path d="M32 7 42.5 32 32 26.5 21.5 32Z" fill="#23A551"/><path d="M32 57 21.5 32 32 37.5 42.5 32Z" fill="#0E1B13"/></svg>'

def kopf(kick): return f'<div class="kopf"><div class="marke">{LOGO}GaLaBau Kompass</div><div class="kick">{kick}</div></div>'
def fuss(n): return f'<div class="fuss"><span>Polo-Designvorschläge · GaLaBau 2026 Nürnberg · Stand 7. September 2026</span><span>Seite {n}</span></div>'

def pdf(bilder, domain):
    pages = [f'''<div class="p">{kopf("Messe GaLaBau 2026 · Polos")}<h1>Drei Vorschläge für das Messe-Polo</h1>
<p class="dek">Schwarzes Piqué-Polo, Druck in Hell, Grün und Lime nach der Magazin-Farbwelt. Jeder Vertriebler bekommt seinen eigenen QR-Code (Ziel: {domain}/s/&lt;kürzel&gt;/ → Standort-Check mit Zuordnung). Die Mockups zeigen die Platzierung maßstäblich; Druckdaten liegen als Vektor-PDF vor.</p>
<div class="drei">''' + "".join(f'<div class="karte"><img src="file://{os.path.join(OUT, f"variante-{k}.jpg")}"><div class="t">Variante {k} · {VARIANTEN[k][0]}</div><div class="s">{VARIANTEN[k][1]}</div></div>' for k in "ABC") + f'</div>{fuss(1)}</div>']
    for i, k in enumerate("ABC"):
        name, text, spec = VARIANTEN[k]
        pages.append(f'''<div class="p">{kopf(f"Variante {k} · {name}")}<div class="var"><div><div class="bilder"><div><img src="file://{bilder[k][0]}"><div class="l">Vorne</div></div><div><img src="file://{bilder[k][1]}"><div class="l">Hinten</div></div></div></div>
<div><h2>Variante {k} · {name}</h2><p class="dek" style="font-size:10pt">{text}</p><div class="spec"><table>''' + "".join(f"<tr><th>{a}</th><td>{b}</td></tr>" for a, b in spec) + f'''<tr><th>Polo</th><td>Schwarz, Baumwoll-Piqué, Kragen und Knopfleiste; Alternative auf Wunsch: Dunkelgrün #0B3D24 mit gleichem Druck</td></tr><tr><th>Verfahren</th><td>Siebdruck oder DTF (Vektordaten, Schriften eingebettet); QR-Kachel als helle Fläche mit schwarzen Modulen, nicht invertieren, nicht verkleinern</td></tr></table></div>
<div class="hin"><b>Stückzahl</b>Je Träger ein Polo mit eigenem QR-Code (Fabio, Niklas, Nick; Julian und Liam optional). Lieferung bis Montag, 14. September 2026.</div></div></div>{fuss(i + 2)}</div>''')
    rows = "".join(f'<tr><td>{n}</td><td>{r}</td><td class="feld">{s}</td><td>Schwarz · Variante ___</td></tr>' for n, r, s in GROESSEN)
    pages.append(f'''<div class="p g">{kopf("Größenliste")}<h1>Größenliste Messe-Polos</h1><p class="dek">Bitte je Person die Polo-Größe eintragen (Herrengrößen S bis 3XL, Piqué fällt normal aus). Freddy nimmt kein Polo.</p>
<table><tr><th>Name</th><th>Rolle</th><th>Größe</th><th>Polo</th></tr>{rows}</table>
<div class="hin"><b>Ablauf</b>1. Variante wählen (A, B oder C) · 2. Größen eintragen · 3. Jana beauftragt den Druck mit den Vektor-Druckdaten (print/&lt;kürzel&gt;/polo-&lt;kürzel&gt;.pdf, je Person eigener QR – Dateien nicht vertauschen) · 4. Andruck scannen (Ergebnis: Standort-Check) · 5. Lieferung bis 14. September 2026, Messe 15.–18. September, Nürnberg.</div>{fuss(5)}</div>''')
    html = f'<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><style>{PDF_CSS}</style></head><body>{"".join(pages)}</body></html>'
    src = os.path.join(WORK, "designvorschlaege.html"); open(src, "w", encoding="utf-8").write(html)
    out = os.path.join(OUT, "polo-designvorschlaege.pdf")
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--allow-file-access-from-files", "--no-pdf-header-footer", "--virtual-time-budget=8000", f"--print-to-pdf={out}", f"file://{src}"], check=True, capture_output=True, timeout=180)
    return out


def pdf_final(bilder, domain):
    name, text, spec = VARIANTEN["C"]
    front, back = bilder["C"]
    rows = "".join(f'<tr><td>{n}</td><td>{r}</td><td class="feld">{s}</td><td>Schwarz · Variante C</td></tr>' for n, r, s in GROESSEN)
    pages = [f'''<div class="p">{kopf("Messe GaLaBau 2026 · Polo · Variante C")}<h1>Das Messe-Polo: Variante C</h1>
<p class="dek">{text} Schwarzes Piqué-Polo, Druck in Hell, Grün und Lime. Jeder Träger bekommt seinen eigenen QR-Code (Ziel: {domain}/s/&lt;kürzel&gt;/ → Standort-Check mit Zuordnung).</p>
<div class="bilder" style="margin-top:8mm;grid-template-columns:1fr 1fr;gap:10mm;"><div><img src="file://{front}"><div class="l">Vorne</div></div><div><img src="file://{back}"><div class="l">Hinten</div></div></div>{fuss(1)}</div>''',
     f'''<div class="p">{kopf("Druckangaben")}<div class="var"><div><h2>Druckangaben</h2><div class="spec"><table>''' + "".join(f"<tr><th>{a}</th><td>{b}</td></tr>" for a, b in spec) + f'''<tr><th>Polo</th><td>Schwarz, Baumwoll-Piqué, Kragen und Knopfleiste</td></tr><tr><th>Verfahren</th><td>Siebdruck oder DTF (Vektordaten, Schriften eingebettet); QR-Kachel als helle Fläche mit schwarzen Modulen, nicht invertieren, nicht verkleinern; Andruck einmal scannen</td></tr><tr><th>Druckdaten</th><td>print/&lt;kürzel&gt;/polo-&lt;kürzel&gt;.pdf – Seite 1 vorne (90 × 100 mm), Seite 2 hinten (300 × 380 mm), Seite 3 Datenblatt. Je Person eigener QR – Dateien nicht vertauschen.</td></tr><tr><th>Termin</th><td>Lieferung bis Montag, 14. September 2026 (Messe 15.–18.09., Nürnberg)</td></tr></table></div></div>
<div class="g"><h2>Größenliste</h2><p class="dek" style="font-size:9.5pt">Herrengrößen S bis 3XL, Piqué fällt normal aus. Freddy nimmt kein Polo.</p><table><tr><th>Name</th><th>Rolle</th><th>Größe</th><th>Polo</th></tr>{rows}</table></div></div>{fuss(2)}</div>''']
    html = f'<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><style>{PDF_CSS}</style></head><body>{"".join(pages)}</body></html>'
    src = os.path.join(WORK, "variante-c.html"); open(src, "w", encoding="utf-8").write(html)
    out = os.path.join(OUT, "polo-variante-c.pdf")
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--allow-file-access-from-files", "--no-pdf-header-footer", "--virtual-time-budget=8000", f"--print-to-pdf={out}", f"file://{src}"], check=True, capture_output=True, timeout=180)
    return out

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--domain", default="galabau-kompass.de"); ap.add_argument("--final", action="store_true", help="nur Variante C als finales PDF"); a = ap.parse_args()
    url = f"https://{a.domain}/s/fabio/"
    if a.final:
        bilder = {"C": variante("C", url)}
        out = pdf_final(bilder, a.domain)
    else:
        bilder = {k: variante(k, url) for k in "ABC"}
        out = pdf(bilder, a.domain)
    print("✓", os.path.relpath(out, ROOT), f"{os.path.getsize(out) // 1024} KB")

if __name__ == "__main__":
    main()
