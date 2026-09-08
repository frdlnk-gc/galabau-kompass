#!/usr/bin/env python3
"""Druckdateien für den Textildruck: freigestellte PNG statt PDF (Jana, 07.09.).

Warum freigestellt: Das Polo ist schwarz. Alles, was im Motiv schwarz ist, darf nicht gedruckt
werden – sonst entstehen sichtbare Kästen auf dem Shirt. Transparente Stellen bleiben Stoff.

Das gilt auch für den QR-Code: Die helle Kachel wird gedruckt, die dunklen Module bleiben
ausgespart. Der Stoff darunter liefert den Kontrast, der Code bleibt scannbar.

Auflösung 300 dpi bei Druckgröße:
  vorne  90 × 100 mm →  1063 × 1181 px
  hinten 300 × 380 mm → 3543 × 4488 px

Aufruf:  python3 tools/polo_png.py            → print/druck-png/*.png + ZIP
"""
import os, subprocess, sys, zipfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image
import polo_print as pp

ROOT = pp.ROOT
OUT = os.path.join(ROOT, "print", "druck-png"); os.makedirs(OUT, exist_ok=True)
DPI = 300
PX_PRO_MM_96 = 96 / 25.4          # Chrome rechnet mm bei 96 dpi
SKALA = DPI / 96                  # Vergrößerung auf 300 dpi

def freistellen(pfad: str) -> Image.Image:
    """Schwarz wird transparent – Hintergrund und QR-Module in einem Schritt.

    Kanten laufen weich aus: Zwischentöne behalten anteilig Deckung, damit die Schrift
    nicht ausfranst. Auf dem schwarzen Stoff fällt der Rest nicht auf.
    """
    im = Image.open(pfad).convert("RGBA")
    px = im.load()
    b, h = im.size
    for y in range(h):
        for x in range(b):
            r, g, bl, a = px[x, y]
            hell = max(r, g, bl)
            if hell <= 26:
                px[x, y] = (r, g, bl, 0)
            elif hell < 80:                       # weicher Übergang an den Kanten
                px[x, y] = (r, g, bl, int(255 * (hell - 26) / 54))
    return im

def rendern(html: str, w_mm: float, h_mm: float, ziel: str) -> str:
    work = os.path.join(ROOT, "print", "_work"); os.makedirs(work, exist_ok=True)
    src = os.path.join(work, "png-" + os.path.basename(ziel).replace(".png", ".html"))
    open(src, "w", encoding="utf-8").write(html)
    roh = os.path.join(work, "roh-" + os.path.basename(ziel))
    pp.chrome([pp.CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
               "--allow-file-access-from-files", "--virtual-time-budget=5000",
               "--default-background-color=00000000",     # ohne das füllt Chrome die Seite weiß

               f"--force-device-scale-factor={SKALA}",
               f"--window-size={round(w_mm * PX_PRO_MM_96)},{round(h_mm * PX_PRO_MM_96)}",
               f"--screenshot={roh}", f"file://{src}"], timeout=180)
    freistellen(roh).save(ziel)
    im = Image.open(ziel)
    print(f"✓ {os.path.relpath(ziel, ROOT)}  {im.width} × {im.height} px  ({w_mm:.0f} × {h_mm:.0f} mm bei {DPI} dpi)")
    return ziel

def seite(kind: str, person: dict, w: float, h: float) -> str:
    """Dieselben Motive wie im PDF, nur ohne die schwarze Fläche."""
    inhalt = pp.page(kind, person, f"https://{DOMAIN}/s/{person['slug']}/", w, h)
    inhalt = inhalt.replace('class="page front"', 'class="page front frei"').replace('class="page back"', 'class="page back frei"')
    return f'''<!DOCTYPE html><html><head><meta charset="UTF-8"><style>{pp.CSS}
html,body{{background:transparent!important;margin:0}}
.page.frei{{background:transparent!important;}}
</style></head><body>{inhalt}</body></html>'''

DOMAIN = "galabau-kompass.de"

ANLEITUNG = """GaLaBau Kompass · Polos für die Messe GaLaBau 2026
Druckdaten für den Textildruck

TEXTIL
Schwarzes Piqué-Polo, Herrengrößen:
  Nick Scheffler    M
  Fabio Zindel      M
  Niklas Kühme      XL

DATEIEN
  01-vorne-brustlogo.png    für alle drei Polos gleich
  02-hinten-nick.png        nur für Nick
  02-hinten-fabio.png       nur für Fabio
  02-hinten-niklas.png      nur für Niklas

Die Rückseiten unterscheiden sich im QR-Code. Jeder Träger hat seinen eigenen,
damit nachvollziehbar bleibt, über welches Polo die Kontakte kommen.
Bitte nicht vertauschen.

FORMAT
  PNG mit Transparenz, 300 dpi bei Druckgröße
  vorne   90 × 100 mm   (1063 × 1181 px)
  hinten  300 × 380 mm  (3544 × 4488 px)

WICHTIG ZUR TRANSPARENZ
Alle transparenten Stellen bleiben Stoff und werden nicht gedruckt. Das gilt
ausdrücklich auch für die dunklen Felder im QR-Code: Sie sind ausgespart, der
schwarze Stoff liefert den Kontrast. Nur die helle Fläche wird gedruckt.
Bitte keine weiße Grundierung unter den gesamten Bereich legen, sonst wird der
QR-Code unlesbar.

FARBEN
  Hell (Schrift, QR-Fläche)   #F2F7F3
  Lime (Anrede, Hinweiszeile) #CDF47A
Beide decken auf Schwarz. Falls Sonderfarben nötig sind, bitte kurz Rücksprache.

PLATZIERUNG
  vorne   Brust links, Oberkante etwa auf Höhe des untersten Knopfes
  hinten  mittig, Oberkante etwa 10 cm unter dem Kragenansatz

Rückfragen: Frederik Linke""" 

def main():
    dateien = []
    erste = pp.PEOPLE[0]
    dateien.append(rendern(seite("front", erste, 90, 100), 90, 100, os.path.join(OUT, "01-vorne-brustlogo.png")))
    for p in pp.PEOPLE:
        dateien.append(rendern(seite("back", p, 300, 380), 300, 380, os.path.join(OUT, f"02-hinten-{p['slug']}.png")))
    hinweis = os.path.join(OUT, "00-hinweise.txt")
    open(hinweis, "w", encoding="utf-8").write(ANLEITUNG)
    zp = os.path.join(OUT, "polo-druckdaten-png.zip")
    with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED) as z:
        z.write(hinweis, "00-hinweise.txt")
        for d in dateien: z.write(d, os.path.basename(d))
    print(f"✓ {os.path.relpath(zp, ROOT)}  {os.path.getsize(zp) // 1024} KB")

if __name__ == "__main__":
    main()
