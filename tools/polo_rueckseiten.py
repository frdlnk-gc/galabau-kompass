#!/usr/bin/env python3
"""Drei Entwürfe für die Polo-Rückseite (Freddy/Julian, 07.09. abends).

Julians Punkt: Der Besucher muss auf zwei Meter Entfernung erkennen, dass er gemeint ist
UND was er vom Scannen hat. Die bisherige Fassung stellte nur eine Frage.
Alle drei Entwürfe: gleiche Fläche 300 × 380 mm, gleicher QR (186 mm), gleiche Farben.
Aufruf:  python3 tools/polo_rueckseiten.py            → print/entwuerfe/*.jpg + Vergleichsblatt
"""
import io, os, subprocess, sys
import segno
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT = os.path.join(ROOT, "print", "entwuerfe"); os.makedirs(OUT, exist_ok=True)
MOCK = os.path.join(ROOT, "print", "_mockup")
CREME, LIME, GRUEN, SCHWARZ = "#F2F7F3", "#CDF47A", "#23A551", "#000000"
URL = "https://galabau-kompass.de/s/niklas/"
MOCK_PX_CM = 12.9

MARK = ('<svg viewBox="0 0 64 64" style="height:{h};width:auto"><circle cx="32" cy="32" r="29" fill="none" stroke="%s" stroke-width="2.4"/>'
        '<path d="M32 7 42.5 32 32 26.5 21.5 32Z" fill="%s"/><path d="M32 57 21.5 32 32 37.5 42.5 32Z" fill="%s"/></svg>' % (CREME, LIME, CREME))

def qr_svg(url):
    q = segno.make(url, error="h"); buf = io.BytesIO()
    q.save(buf, kind="svg", xmldecl=False, svgns=True, scale=10, border=0, dark=SCHWARZ, light=None, svgclass=None, lineclass=None, omitsize=True)
    return buf.getvalue().decode()

CSS = f"""
@font-face{{font-family:'Plus Jakarta Sans';src:url('file://{ROOT}/assets/fonts/jakarta-var.woff2') format('woff2');font-weight:200 800;}}
@font-face{{font-family:'Inter';src:url('file://{ROOT}/assets/fonts/inter-var.woff2') format('woff2');font-weight:400 800;}}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{background:#fff}}
.back{{background:{SCHWARZ};color:{CREME};font-family:'Plus Jakarta Sans',sans-serif;display:flex;flex-direction:column;
       align-items:center;justify-content:space-between;text-align:center;padding:14mm 10mm 12mm;overflow:hidden}}
.kicker{{font-size:6.4mm;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:{LIME};margin-bottom:7mm}}
.gross{{font-weight:800;letter-spacing:-.035em;line-height:1.02}}
.qrwrap{{background:{CREME};border-radius:8mm;padding:7mm;display:flex;align-items:center;justify-content:center;width:172mm;height:172mm;flex:none}}
.qrwrap svg{{width:100%;height:100%;display:block}}
.unten{{display:flex;flex-direction:column;align-items:center;gap:4.5mm}}
.cta{{font-size:8.4mm;font-weight:800;color:{LIME};line-height:1.2}}
.cta small{{display:block;font-size:5.2mm;font-weight:600;color:rgba(242,247,243,.68);margin-top:2.5mm;letter-spacing:0}}
.logo{{display:flex;align-items:center;gap:5mm;font-size:15mm}}
.logo .word{{font-weight:800;letter-spacing:-.03em;line-height:1}}
.foot{{font-size:4mm;letter-spacing:.14em;text-transform:uppercase;color:rgba(242,247,243,.5)}}
"""

def entwurf(key: str) -> str:
    """Drei Kombinationen aus Ansprache und Frage.

    Julian will, dass man auf zwei Meter erkennt, dass man gemeint ist. Freddy will kein
    Marktgeschrei. Beides geht zusammen, wenn die Ansprache groß ist, aber nichts ruft:
    eine Anrede benennt die Zielgruppe, ein Ausrufezeichen kommandiert sie.
    """
    qr = f'<div class="qrwrap">{qr_svg(URL)}</div>'
    logo = f'<div class="logo">{MARK.format(h="15mm")}<div class="word">GaLaBau Kompass</div></div>'
    cta = ('<div class="cta">Umfrage ausfüllen, Standortcheck per Mail erhalten'
           '<small>Kostenlos · zwei Minuten · Branchenumfrage 2026</small></div>')

    if key == "A":
        # Anrede und Frage getrennt, beide groß. Der Doppelpunkt ersetzt das Ausrufezeichen.
        return f'''<div><div class="gross" style="font-size:29mm;color:{LIME};line-height:1;white-space:nowrap;">GaLaBau-Betriebe:</div>
<div class="gross" style="font-size:22mm;margin-top:6mm;">Wie viele Fachkräfte<br>wohnen in Ihrem<br>Umkreis?</div></div>
{qr}
<div class="unten">{cta}{logo}<div class="foot">galabau-kompass.de</div></div>'''

    if key == "B":
        # Die Zielgruppe steckt in der Frage. Eine Zeile weniger, dafür alles groß.
        return f'''<div class="kicker">Kostenlos · Branchenumfrage 2026</div>
<div class="gross" style="font-size:22mm;margin-bottom:10mm;">Wie viele Fachkräfte<br>wohnen im Umkreis<br>Ihres <span style="color:{LIME}">GaLaBau-Betriebs</span>?</div>
{qr}
<div class="unten">{cta}{logo}<div class="foot">galabau-kompass.de</div></div>'''

    # C: Anrede als schmale Zeile über einer sehr großen Frage – maximaler Größenunterschied.
    return f'''<div class="gross" style="font-size:13mm;color:{LIME};letter-spacing:.02em;margin-bottom:5mm;">Für GaLaBau-Betriebe</div>
<div class="gross" style="font-size:25mm;margin-bottom:10mm;">Wie viele<br>Fachkräfte<br>sind in Ihrer<br>Nähe?</div>
{qr}
<div class="unten">{cta}{logo}<div class="foot">galabau-kompass.de</div></div>'''

def render(key: str, w=300, h=380) -> Image.Image:
    html = f'''<!DOCTYPE html><html><head><meta charset="UTF-8"><style>{CSS}</style></head>
<body><div class="back" style="width:{w}mm;height:{h}mm;">{entwurf(key)}</div></body></html>'''
    work = os.path.join(ROOT, "print", "_work"); os.makedirs(work, exist_ok=True)
    src = os.path.join(work, f"entwurf-{key}.html"); open(src, "w", encoding="utf-8").write(html)
    png = os.path.join(work, f"entwurf-{key}.png")
    cmd = [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
           "--virtual-time-budget=4000", f"--window-size={int(w*3.78)},{int(h*3.78)}", f"--screenshot={png}", f"file://{src}"]
    for versuch in range(3):
        try: subprocess.run(cmd, check=True, capture_output=True, timeout=90); break
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError):
            if versuch == 2: raise
    return Image.open(png).convert("RGB")

def auf_polo(art: Image.Image) -> Image.Image:
    """Motiv auf das Polo legen – gleiche Technik wie polo_design.py."""
    from PIL import ImageChops, ImageFilter
    mock = Image.open(os.path.join(MOCK, "polo-back.png")).convert("RGB")
    w = int(30 * MOCK_PX_CM); h = int(art.height * w / art.width)
    art = art.resize((w, h), Image.LANCZOS)
    x0 = int(512 - w / 2); box = (x0, 430, x0 + w, 430 + h)
    region = mock.crop(box)
    lum = region.convert("L").filter(ImageFilter.GaussianBlur(6)).point(lambda v: min(255, int(180 + v * 0.6)))
    art = ImageChops.multiply(art, Image.merge("RGB", (lum, lum, lum)))
    mock.paste(ImageChops.lighter(region, art), box)
    return mock

def main():
    bilder = []
    for key in ("A", "B", "C"):
        art = render(key)
        art.save(os.path.join(OUT, f"rueckseite-{key}.jpg"), quality=88, optimize=True)
        polo = auf_polo(art); polo.save(os.path.join(OUT, f"polo-{key}.jpg"), quality=86, optimize=True)
        bilder.append(polo)
        print(f"✓ Entwurf {key}")
    b = min(x.width for x in bilder); h = max(int(x.height * b / x.width) for x in bilder)
    blatt = Image.new("RGB", (b * 3 + 40, h), "white")
    for i, x in enumerate(bilder): blatt.paste(x.resize((b, int(x.height * b / x.width)), Image.LANCZOS), (i * (b + 20), 0))
    blatt.save(os.path.join(OUT, "vergleich.jpg"), quality=84, optimize=True)
    print("✓ print/entwuerfe/vergleich.jpg")

if __name__ == "__main__":
    main()
