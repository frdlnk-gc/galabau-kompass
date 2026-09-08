#!/usr/bin/env python3
"""Messe-Visitenkarten GaLaBau 2026 · fünf Entwürfe (Neuauflage nach Freddys Kritik 08.09.).

Kritik am Stand vom 07.09.: „vorne und hinten einfach lahm, der Platz ist nicht optimal
genutzt, designtechnisch zu schwach." Stimmt — die alte Karte stapelt drei linksbündige
Blöcke und lässt die rechte Kartenhälfte leer; die Rückseite trägt einen Satz und einen
14-mm-QR, der nichts verspricht.

Was diese Fassung anders macht:
  · Jede Karte hat EIN tragendes Gestaltungselement, das die freie Fläche übernimmt —
    statt Leere, die nach vergessenem Inhalt aussieht.
  · Echte Hierarchie: Name 6,4–8,6 mm (vorher 5,5), Telefon als eigenes Gewicht.
    Am Stand ist die Mobilnummer die wichtigste Angabe der ganzen Karte.
  · Die Rückseite verkauft, statt zu dekorieren: konkretes Versprechen + QR ab 17 mm
    (vorher 14) + Aufforderung. Ein QR ohne Grund wird nicht gescannt.
  · QR personalisiert je Vertriebler (`?src=visitenkarte&v=<slug>`) — wie beim Polo, aber
    mit eigener Quelle. Bisher zeigte er auf die nackte Startseite: Scan ohne Zuordnung,
    und Freddys Regel „Messekontakte gehören dem Vertriebler" lief ins Leere.

Gestaltungsregeln (aus der ersten Fassung übernommen, sie waren richtig):
  · Das GC-Logo hat ein festes Seitenverhältnis von 1,795 : 1. Breite UND Höhe immer
    zusammen setzen, dazu object-fit:contain und align-self:flex-start – in einem
    Flex-Container zieht align-items:stretch ein <img> sonst auf Containerbreite.
  · Sicherheitsabstand: 8 mm ab Dateirand = 5 mm ab Schnittkante. Farbflächen laufen
    randabfallend über den Beschnitt, Text nie.

Format 85 × 55 mm plus 3 mm Beschnitt → 91 × 61 mm Enddatei.
Aufruf:
  python3 tools/visitenkarten_v2.py                     → 5 Entwürfe + zwei Vergleichsblätter
  python3 tools/visitenkarten_v2.py --final --entwurf=3  → Druck-PDFs für alle fünf Personen
  python3 tools/visitenkarten_v2.py --paket --entwurf=1  → komplettes Druckpaket (PDF + PNG + Anleitung)
"""
import base64, datetime, io, math, os, subprocess, sys
import segno
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT = os.path.join(ROOT, "print", "visitenkarten-v2"); os.makedirs(OUT, exist_ok=True)
ASSETS = os.path.join(ROOT, "print", "_assets")
WORK = os.path.join(ROOT, "print", "_work", "vk2"); os.makedirs(WORK, exist_ok=True)

GRUEN, LIME, CREME, INK, GRAU = "#0B3D24", "#CDF47A", "#F2F7F3", "#0E1B13", "#6B7B71"
WEISS = "#FFFFFF"
DATUM = datetime.date.today().strftime("%d.%m.%Y")
LOGO_V = 1.795

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

def logo(hell: bool, breite_mm: float, klasse="gc") -> str:
    h = round(breite_mm / LOGO_V, 2)
    quelle = GC_HELL if hell else GC_DUNKEL
    return f'<img class="{klasse}" src="{quelle}" alt="GreenCareers" style="width:{breite_mm}mm;height:{h}mm">'

def nadel(h_mm: float, kachel: str, nord: str, sued: str, stil="") -> str:
    """Das Favicon-Signet: abgerundete Kachel, Nordspitze Lime, Südspitze hell."""
    r = f'<rect width="64" height="64" rx="14" fill="{kachel}"/>' if kachel else ""
    return (f'<svg viewBox="0 0 64 64" style="width:{h_mm}mm;height:{h_mm}mm;flex:none;{stil}">{r}'
            f'<path d="M32 3.25 44.075 32 32 25.675 19.925 32Z" fill="{nord}"/>'
            f'<path d="M32 60.75 19.925 32 32 38.325 44.075 32Z" fill="{sued}"/></svg>')

def rose(groesse_mm: float, farbe: str, stil="") -> str:
    """Kompassrose als reine Linienzeichnung: zwei Ringe, 16 Teilstriche, 8 Spitzen.

    Bewusst nur Konturen — gefüllte Flächen wirken im Kleinformat schmutzig, feine
    Linien lesen sich wie eine Prägung."""
    c, teile = 100, []
    teile.append(f'<circle cx="{c}" cy="{c}" r="92" fill="none" stroke="{farbe}" stroke-width="1"/>')
    teile.append(f'<circle cx="{c}" cy="{c}" r="84" fill="none" stroke="{farbe}" stroke-width="1"/>')
    teile.append(f'<circle cx="{c}" cy="{c}" r="30" fill="none" stroke="{farbe}" stroke-width="1"/>')
    for i in range(32):                                    # Teilstriche im Ring, jeder vierte länger
        w = math.radians(i * 11.25)
        lang = 8 if i % 4 == 0 else 4
        x1, y1 = c + 84 * math.sin(w), c - 84 * math.cos(w)
        x2, y2 = c + (84 + lang) * math.sin(w), c - (84 + lang) * math.cos(w)
        teile.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{farbe}" stroke-width="1"/>')
    for i in range(8):                                     # Spitzen: Hauptrichtungen lang, Nebenrichtungen kurz
        w = math.radians(i * 45)
        laenge = 82 if i % 2 == 0 else 58
        breite = 16 if i % 2 == 0 else 11
        sx, sy = math.sin(w), -math.cos(w)                 # Richtung der Spitze
        qx, qy = math.cos(w), math.sin(w)                  # Richtung quer dazu
        px, py = c + laenge * sx, c + laenge * sy
        ax, ay = c + breite * qx, c + breite * qy
        bx, by = c - breite * qx, c - breite * qy
        teile.append(f'<path d="M{px:.1f} {py:.1f} L{ax:.1f} {ay:.1f} L{c} {c} L{bx:.1f} {by:.1f}Z" '
                     f'fill="none" stroke="{farbe}" stroke-width="1" stroke-linejoin="round"/>')
    return (f'<svg viewBox="0 0 200 200" style="width:{groesse_mm}mm;height:{groesse_mm}mm;flex:none;{stil}">'
            + "".join(teile) + '</svg>')

def qr(url: str, farbe: str) -> str:
    q = segno.make(url, error="m"); buf = io.BytesIO()
    q.save(buf, kind="svg", xmldecl=False, svgns=True, scale=10, border=0, dark=farbe, light=None,
           svgclass=None, lineclass=None, omitsize=True)
    return buf.getvalue().decode()

def hervor(satz: str, wort: str) -> str:
    """Ein Wort mit Lime unterstreichen.

    Lime als Schriftfarbe auf Off-White liegt bei 1,15:1 Kontrast – unlesbar. Als Linie
    unter dunkelgrünem Text (11,35:1) trägt dieselbe Farbe den Akzent, ohne die Lesbarkeit
    anzutasten. Deshalb Unterstreichung statt Einfärbung."""
    return satz.replace(wort, f'<span class="mark">{wort}</span>', 1)


def ziel(p):
    """Persönliches QR-Ziel: die Branchenumfrage, mit Vertriebler-Zuordnung und eigener Quelle.

    Dasselbe Ziel wie der Polo-QR (der über /s/<slug>/ läuft) – ein Kanal, eine Handlung.
    Der Standort-Check kommt danach automatisch per Mail; als QR-Ziel würde er die Umfrage
    umgehen. kompass.js übernimmt src/v/k frei aus der URL."""
    return f'https://galabau-kompass.de/umfrage/?src=visitenkarte&v={p["vorname"].lower()}'

# ── Texte ─────────────────────────────────────────────────────────────────────
# B2B-Stimme laut Brand-Guideline: Sie, sachlich, „Fachkräfte", „Betrieb", keine
# Hype-Wörter, keine geschätzten Zahlen. Die Frage ist dieselbe wie auf dem Polo –
# der Besucher hat sie am Stand schon gelesen, die Karte holt sie ab.
# „Standort-Check" steht bewusst nur einmal je Rückseite: als Handlung, nicht als
# Beschreibung. Zweimal derselbe Produktname liest sich wie ein Platzhalter.
KICKER     = "Branchenumfrage 2026"
FRAGE      = "Wie gewinnen GaLaBau-Betriebe heute Mitarbeiter?"
CTA        = "2 Minuten — jetzt mitmachen"
SUB        = "Dankeschön: Ihr kostenloser Standort‑Check\ngalabau-kompass.de"
MAGAZIN_UZ = "Das Magazin für den Garten- und Landschaftsbau"
CLAIM      = "Mitarbeitergewinnung im GaLaBau"
DOMAIN     = "galabau-kompass.de"

HAIR_HELL = "#D9E2DB"
HAIR_DUNKEL = "rgba(205,244,122,.28)"

CSS = f"""
@font-face{{font-family:'Plus Jakarta Sans';src:url('file://{ROOT}/assets/fonts/jakarta-var.woff2') format('woff2');font-weight:200 800;}}
@font-face{{font-family:'Inter';src:url('file://{ROOT}/assets/fonts/inter-var.woff2') format('woff2');font-weight:400 700;}}
*{{margin:0;padding:0;box-sizing:border-box}}
@page{{size:91mm 61mm;margin:0}}
body{{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.karte{{width:91mm;height:61mm;position:relative;overflow:hidden;page-break-after:always;
        font-family:Inter,sans-serif;display:flex;flex-direction:column;background:#fff}}
.gc{{object-fit:contain;align-self:flex-start;display:block;flex:none}}
.name{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;letter-spacing:-.025em;line-height:1.05}}
.rolle{{font-weight:600;letter-spacing:.14em;text-transform:uppercase}}
.tel{{font-weight:600;white-space:nowrap;font-variant-numeric:tabular-nums}}
.mail{{font-weight:400;white-space:nowrap}}
.qrbox svg{{display:block;width:100%;height:100%}}
.lage{{position:absolute;z-index:0}}
.inhalt{{position:relative;z-index:1;display:flex;flex-direction:column;height:100%}}
.kword{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;letter-spacing:-.02em;white-space:nowrap}}
.kmarke{{display:flex;align-items:center;gap:2.4mm}}
.cta{{font-weight:700;letter-spacing:.01em}}
/* Linie sitzt in der Zeilenbox unterhalb der Grundlinie – kein border-bottom, der würde
   bei mehrzeiligem Umbruch über die ganze Breite laufen. */
.mark{{background:linear-gradient(to top,{LIME} 1.1mm,transparent 1.1mm)}}

/* ══ 1 · NADEL ════════════════════════════════════════════════════════════════
   Das Signet wird zur Architektur: 76 mm hoch, rechts angeschnitten, Ton in Ton
   wie eine Blindprägung. Es übernimmt die ganze rechte Kartenhälfte – genau die
   Fläche, die vorher leer stand – ohne dem Namen Aufmerksamkeit zu nehmen.     */
.e1v{{background:{GRUEN};color:{CREME};padding:8mm}}
.e1v .lage{{right:-17mm;top:-6.5mm}}
.e1v .inhalt{{justify-content:space-between}}
.e1v .block{{max-width:52mm}}
.e1v .name{{font-size:6.6mm;color:#fff;margin-bottom:1.6mm}}
.e1v .rolle{{font-size:2.5mm;color:{LIME}}}
.e1v .fuss{{border-top:.25mm solid {HAIR_DUNKEL};padding-top:2.6mm;margin-top:2.6mm;width:47mm}}
.e1v .tel{{font-size:3.3mm;color:#fff;letter-spacing:.01em}}
.e1v .mail{{font-size:2.85mm;color:rgba(242,247,243,.72);margin-top:.9mm}}
.e1h{{background:{CREME};color:{INK};padding:8mm}}
.e1h .inhalt{{justify-content:space-between}}
.e1h .kword{{font-size:4.8mm;color:{GRUEN}}}
.e1h .kicker{{font-size:2.35mm;letter-spacing:.15em;text-transform:uppercase;color:#3F7A56;
              font-weight:700;margin-bottom:2mm}}
.e1h .frage{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:4.35mm;
             line-height:1.2;letter-spacing:-.022em;color:{GRUEN};max-width:56mm}}
.e1h .unten{{display:flex;align-items:center;gap:4.5mm}}
.e1h .qrbox{{width:18.5mm;height:18.5mm;flex:none}}
.e1h .cta{{font-size:2.8mm;color:{GRUEN}}}
.e1h .sub{{font-size:2.45mm;color:{GRAU};line-height:1.45;margin-top:1mm;white-space:pre-line}}

/* ══ 2 · SCHNITT ══════════════════════════════════════════════════════════════
   Waagerechter Farbschnitt statt gestapelter Blöcke. Die Kontaktdaten bekommen
   ein eigenes Feld über die volle Breite – dadurch passt auch die längste
   E-Mail-Adresse in eine Zeile, und die Nummer findet man ohne Suchen.         */
.e2v{{background:#fff}}
.e2v .oben{{flex:1;padding:8mm 8mm 0;display:flex;flex-direction:column;justify-content:space-between}}
.e2v .block{{padding-bottom:5.5mm}}
.e2v .name{{font-size:6.8mm;color:{INK};margin-bottom:1.5mm}}
.e2v .rolle{{font-size:2.5mm;color:#3F7A56}}
.e2v .band{{background:{GRUEN};color:#fff;padding:5.2mm 8mm 8mm;display:flex;align-items:baseline;
            justify-content:space-between;gap:4mm}}
.e2v .tel{{font-size:3.4mm}}
.e2v .mail{{font-size:2.8mm;color:rgba(242,247,243,.75)}}
.e2h{{background:#fff}}
.e2h .band{{background:{GRUEN};color:{CREME};padding:8mm 8mm 5.5mm;display:flex;align-items:center;
            justify-content:space-between;gap:4mm}}
.e2h .kword{{font-size:4.4mm;color:#fff}}
.e2h .uz{{font-size:2.15mm;color:{LIME};letter-spacing:.1em;text-transform:uppercase;
          font-weight:600;white-space:nowrap}}
.e2h .unten{{flex:1;padding:5.5mm 8mm 8mm;display:flex;align-items:center;gap:5mm}}
.e2h .qrbox{{width:20.5mm;height:20.5mm;flex:none}}
.e2h .frage{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:4.3mm;
             line-height:1.2;letter-spacing:-.022em;color:{GRUEN}}}
.e2h .cta{{font-size:2.7mm;color:{GRUEN};margin-top:2mm}}
.e2h .sub{{font-size:2.5mm;color:{GRAU};margin-top:.7mm}}

/* ══ 3 · KOPF ═════════════════════════════════════════════════════════════════
   Die Karte zitiert den Zeitungskopf des Magazins: Haarlinien statt Rahmen,
   Versalzeile über dem Namen, Angaben in benannten Spalten wie im Impressum.
   Ordnung ist hier das Gestaltungsmittel – keine Fläche, keine Grafik.         */
.e3v{{background:#fff;color:{INK};padding:8mm}}
.e3v .kopf{{display:flex;align-items:center;justify-content:space-between;gap:4mm;
            padding-bottom:2.6mm;border-bottom:.25mm solid {HAIR_HELL}}}
.e3v .claim{{font-size:2.1mm;letter-spacing:.13em;text-transform:uppercase;color:{GRAU};
             font-weight:600;white-space:nowrap}}
.e3v .mitte{{flex:1;display:flex;flex-direction:column;justify-content:center;padding:1mm 0}}
.e3v .kicker{{font-size:2.4mm;letter-spacing:.15em;text-transform:uppercase;color:#3F7A56;
              font-weight:700;margin-bottom:2.2mm}}
.e3v .name{{font-size:7.2mm}}
.e3v .spalten{{display:flex;gap:7mm;border-top:.25mm solid {HAIR_HELL};padding-top:2.8mm}}
.e3v .lab{{font-size:2mm;letter-spacing:.16em;text-transform:uppercase;color:{GRAU};
           font-weight:600;margin-bottom:.9mm}}
.e3v .tel,.e3v .mail{{font-size:2.9mm;color:{INK}}}
.e3h{{background:{GRUEN};color:{CREME};padding:8mm;align-items:center;text-align:center}}
.e3h .kmarke{{justify-content:center}}
.e3h .kword{{font-size:4.8mm;color:#fff}}
.e3h .nr{{font-size:1.95mm;letter-spacing:.12em;text-transform:uppercase;color:{LIME};
          font-weight:600;margin-top:2.4mm;padding-top:2.4mm;white-space:nowrap;
          border-top:.25mm solid {HAIR_DUNKEL};width:100%}}
.e3h .mitte{{flex:1;display:flex;align-items:center;justify-content:space-between;gap:5mm;
             width:100%;text-align:left}}
.e3h .frage{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:3.85mm;
             line-height:1.2;letter-spacing:-.022em;color:#fff;max-width:43mm}}
.e3h .cta{{font-size:2.5mm;color:{LIME};margin-top:1.4mm;white-space:nowrap}}
.e3h .qrbox{{width:18mm;height:18mm;flex:none;background:{CREME};padding:1.2mm;border-radius:1.2mm}}
.e3h .fuss{{font-size:2.3mm;letter-spacing:.06em;color:rgba(242,247,243,.55);width:100%;
            border-top:.25mm solid {HAIR_DUNKEL};padding-top:2.4mm}}

/* ══ 4 · GROSS ════════════════════════════════════════════════════════════════
   Der Name ist das Bild. Zweizeilig, fast randbündig, Vorname mager und
   Nachname fett – so bleibt er hängen, und die Fläche ist ohne Dekoration voll.
   Schriftgrad richtet sich nach der längsten Zeile, sonst bricht „Scheffler".  */
.e4v{{background:{CREME};color:{INK};padding:8mm}}
.e4v .inhalt{{justify-content:space-between}}
.e4v .gross{{font-family:'Plus Jakarta Sans',sans-serif;line-height:.97;letter-spacing:-.038em}}
.e4v .gross .vn{{font-weight:300;color:#46594E;display:block}}
.e4v .gross .nn{{font-weight:800;color:{GRUEN};display:block}}
.e4v .strich{{width:13mm;height:1mm;background:{LIME};margin:3.2mm 0 2.4mm;border-radius:.5mm}}
.e4v .rolle{{font-size:2.5mm;color:{GRAU}}}
.e4v .unten{{display:flex;align-items:flex-end;justify-content:space-between;gap:4mm}}
.e4v .tel{{font-size:3.2mm;color:{INK}}}
.e4v .mail{{font-size:2.8mm;color:#46594E;margin-top:.8mm}}
.e4h{{background:{GRUEN};color:{CREME};padding:8mm}}
.e4h .inhalt{{justify-content:space-between}}
.e4h .kword{{font-size:4.4mm;color:#fff}}
.e4h .frage{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:5.6mm;
             line-height:1.13;letter-spacing:-.028em;color:{LIME}}}
.e4h .unten{{display:flex;align-items:flex-end;justify-content:space-between;gap:4.5mm}}
.e4h .qrbox{{width:20.5mm;height:20.5mm;flex:none}}
.e4h .cta{{font-size:2.8mm;color:#fff}}
.e4h .sub{{font-size:2.5mm;color:rgba(242,247,243,.62);line-height:1.4;margin-top:1mm}}

/* ══ 5 · ROSE ═════════════════════════════════════════════════════════════════
   Eine gestochene Kompassrose als Wasserzeichen über beide Seiten. Sie gibt der
   Karte Tiefe, ohne Text zu verdrängen – Linien statt Flächen, weil gefüllte
   Formen im Kleinformat schmutzig wirken.                                      */
.e5v{{background:#fff;color:{INK};padding:8mm}}
.e5v .lage{{right:-21mm;top:-12mm}}
.e5v .inhalt{{justify-content:space-between}}
.e5v .block{{max-width:52mm}}
.e5v .name{{font-size:6.6mm;color:{GRUEN};margin-bottom:1.5mm}}
.e5v .rolle{{font-size:2.5mm;color:{GRAU}}}
.e5v .fuss{{border-top:.25mm solid {HAIR_HELL};padding-top:2.6mm;margin-top:2.6mm;width:47mm}}
.e5v .tel{{font-size:3.3mm;color:{INK}}}
.e5v .mail{{font-size:2.85mm;color:#46594E;margin-top:.9mm}}
.e5h{{background:{GRUEN};color:{CREME};padding:8mm}}
.e5h .lage{{right:-24mm;bottom:-17mm}}
.e5h .inhalt{{justify-content:space-between}}
.e5h .kword{{font-size:4.8mm;color:#fff}}
.e5h .frage{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:4.35mm;
             line-height:1.2;letter-spacing:-.022em;color:{LIME};max-width:54mm}}
.e5h .unten{{display:flex;align-items:center;gap:4.5mm}}
.e5h .qrbox{{width:18.5mm;height:18.5mm;flex:none;background:{CREME};padding:1.2mm;border-radius:1.2mm}}
.e5h .cta{{font-size:2.8mm;color:#fff}}
.e5h .sub{{font-size:2.5mm;color:rgba(242,247,243,.62);line-height:1.4;margin-top:1mm}}
"""


def karte(p: dict, entwurf: str) -> str:
    name = f'{p["vorname"]} {p["nachname"]}'
    url = ziel(p)

    # ── 1 · NADEL ──────────────────────────────────────────────────────────────
    if entwurf == "1":
        return f'''
<section class="karte e1v">
  <div class="lage">{nadel(74, "rgba(242,247,243,.07)", "rgba(205,244,122,.19)", "rgba(242,247,243,.10)")}</div>
  <div class="inhalt">
    {logo(True, 21)}
    <div class="block">
      <div class="name">{name}</div>
      <div class="rolle">{p["rolle"]}</div>
      <div class="fuss">
        <div class="tel">{p["tel"]}</div>
        <div class="mail">{p["mail"]}</div>
      </div>
    </div>
  </div>
</section>
<section class="karte e1h">
  <div class="inhalt">
    <div class="kmarke">{nadel(7.4, GRUEN, LIME, CREME)}<div class="kword">GaLaBau Kompass</div></div>
    <div>
      <div class="kicker">{KICKER}</div>
      <div class="frage">{hervor(FRAGE, "Mitarbeiter")}</div>
    </div>
    <div class="unten">
      <div class="qrbox">{qr(url, GRUEN)}</div>
      <div>
        <div class="cta">{CTA}</div>
        <div class="sub">{SUB}</div>
      </div>
    </div>
  </div>
</section>'''

    # ── 2 · SCHNITT ────────────────────────────────────────────────────────────
    if entwurf == "2":
        return f'''
<section class="karte e2v">
  <div class="oben">
    {logo(False, 21)}
    <div class="block">
      <div class="name">{name}</div>
      <div class="rolle">{p["rolle"]}</div>
    </div>
  </div>
  <div class="band">
    <div class="tel">{p["tel"]}</div>
    <div class="mail">{p["mail"]}</div>
  </div>
</section>
<section class="karte e2h">
  <div class="band">
    <div class="kmarke">{nadel(7.4, "rgba(242,247,243,.14)", LIME, CREME)}<div class="kword">GaLaBau Kompass</div></div>
    <div class="uz">{DOMAIN}</div>
  </div>
  <div class="unten">
    <div class="qrbox">{qr(url, GRUEN)}</div>
    <div>
      <div class="frage">{FRAGE}</div>
      <div class="cta">{CTA} — kostenlos</div>
    </div>
  </div>
</section>'''

    # ── 3 · KOPF ───────────────────────────────────────────────────────────────
    if entwurf == "3":
        return f'''
<section class="karte e3v">
  <div class="kopf">
    <div class="claim">{CLAIM}</div>
    {logo(False, 18)}
  </div>
  <div class="mitte">
    <div class="kicker">{p["rolle"]}</div>
    <div class="name">{name}</div>
  </div>
  <div class="spalten">
    <div>
      <div class="lab">Telefon</div>
      <div class="tel">{p["tel"]}</div>
    </div>
    <div>
      <div class="lab">E-Mail</div>
      <div class="mail">{p["mail"]}</div>
    </div>
  </div>
</section>
<section class="karte e3h">
  <div class="kmarke">{nadel(7.4, "rgba(242,247,243,.14)", LIME, CREME)}<div class="kword">GaLaBau Kompass</div></div>
  <div class="nr">{MAGAZIN_UZ}</div>
  <div class="mitte">
    <div>
      <div class="frage">{FRAGE}</div>
      <div class="cta">{CTA}</div>
    </div>
    <div class="qrbox">{qr(url, GRUEN)}</div>
  </div>
  <div class="fuss">{DOMAIN}</div>
</section>'''

    # ── 4 · GROSS ──────────────────────────────────────────────────────────────
    if entwurf == "4":
        laengste = max(len(p["vorname"]), len(p["nachname"]))
        fs = 9.6 if laengste <= 8 else 8.6
        return f'''
<section class="karte e4v">
  <div class="inhalt">
    <div>
      <div class="gross" style="font-size:{fs}mm">
        <span class="vn">{p["vorname"]}</span>
        <span class="nn">{p["nachname"]}</span>
      </div>
      <div class="strich"></div>
      <div class="rolle">{p["rolle"]}</div>
    </div>
    <div class="unten">
      <div>
        <div class="tel">{p["tel"]}</div>
        <div class="mail">{p["mail"]}</div>
      </div>
      {logo(False, 19)}
    </div>
  </div>
</section>
<section class="karte e4h">
  <div class="inhalt">
    <div class="kmarke">{nadel(7.4, "rgba(242,247,243,.14)", LIME, CREME)}<div class="kword">GaLaBau Kompass</div></div>
    <div class="frage">{FRAGE}</div>
    <div class="unten">
      <div>
        <div class="cta">{CTA}</div>
        <div class="sub">{SUB}</div>
      </div>
      <div class="qrbox">{qr(url, CREME)}</div>
    </div>
  </div>
</section>'''

    # ── 5 · ROSE ───────────────────────────────────────────────────────────────
    return f'''
<section class="karte e5v">
  <div class="lage">{rose(82, "#D3E2D8")}</div>
  <div class="inhalt">
    {logo(False, 21)}
    <div class="block">
      <div class="name">{name}</div>
      <div class="rolle">{p["rolle"]}</div>
      <div class="fuss">
        <div class="tel">{p["tel"]}</div>
        <div class="mail">{p["mail"]}</div>
      </div>
    </div>
  </div>
</section>
<section class="karte e5h">
  <div class="lage">{rose(86, "rgba(205,244,122,.22)")}</div>
  <div class="inhalt">
    <div class="kmarke">{nadel(7.4, "rgba(242,247,243,.14)", LIME, CREME)}<div class="kword">GaLaBau Kompass</div></div>
    <div class="frage">{FRAGE}</div>
    <div class="unten">
      <div class="qrbox">{qr(url, GRUEN)}</div>
      <div>
        <div class="cta">{CTA}</div>
        <div class="sub">{SUB}</div>
      </div>
    </div>
  </div>
</section>'''

ENTWUERFE = {"1": "Nadel", "2": "Schnitt", "3": "Kopf", "4": "Gross", "5": "Rose"}

def chrome(args, timeout=90):
    for versuch in range(3):
        try: subprocess.run(args, check=True, capture_output=True, timeout=timeout); return
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError):
            if versuch == 2: raise

def bauen(p, entwurf, pdf_ziel=None, png=True):
    slug = p["vorname"].lower()
    html = f'<!DOCTYPE html><html><head><meta charset="UTF-8"><style>{CSS}</style></head><body>{karte(p, entwurf)}</body></html>'
    src = os.path.join(WORK, f"vk-{slug}-{entwurf}.html"); open(src, "w", encoding="utf-8").write(html)
    if pdf_ziel:
        chrome([CHROME, "--headless=new", "--disable-gpu", "--allow-file-access-from-files", "--no-pdf-header-footer",
                "--virtual-time-budget=4000", f"--print-to-pdf={pdf_ziel}", f"file://{src}"])
    if not png:
        return None
    ziel_png = os.path.join(WORK, f"vk-{slug}-{entwurf}.png")
    # window-size erwartet CSS-Pixel (96 dpi), nicht Gerätepixel – sonst steht die Karte
    # in einem viel zu großen weißen Fenster. Die Auflösung kommt aus dem scale-factor.
    css_px = lambda mm: round(mm / 25.4 * 96)
    chrome([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
            "--virtual-time-budget=4000", f"--window-size={css_px(91)},{css_px(122)}",
            "--force-device-scale-factor=4", f"--screenshot={ziel_png}", f"file://{src}"])
    return ziel_png

def seiten(png):
    im = Image.open(png).convert("RGB"); h = im.height // 2
    return im.crop((0, 0, im.width, h)), im.crop((0, h, im.width, h * 2))

def schrift(groesse):
    """Systemschrift für die Beschriftung der Vergleichsblätter (nicht für die Karten)."""
    from PIL import ImageFont
    for pfad in ("/System/Library/Fonts/Supplemental/Arial Bold.ttf",
                 "/System/Library/Fonts/Helvetica.ttc"):
        if os.path.exists(pfad):
            try: return ImageFont.truetype(pfad, groesse)
            except OSError: pass
    return ImageFont.load_default()


def blatt(reihen, pfad, breite_ziel=1800):
    """Vergleichsblatt: je Zeile Vorder- und Rückseite nebeneinander, beschriftet.

    Jede Karte bekommt eine Haarlinie als Rahmen – ohne sie fließen zwei Karten mit
    randabfallender Farbfläche (Entwurf 2) optisch ineinander."""
    from PIL import ImageDraw
    b, hh = reihen[0][1].size
    rand, luecke, kopf = 54, 46, 62
    breite = b * 2 + luecke + rand * 2
    hoehe = (hh + kopf + luecke) * len(reihen) + rand * 2 - luecke
    bild = Image.new("RGB", (breite, hoehe), "#EDF1EE")
    stift = ImageDraw.Draw(bild)
    f_titel, f_klein = schrift(38), schrift(24)
    for i, (titel, v, r) in enumerate(reihen):
        y = rand + i * (hh + kopf + luecke)
        stift.text((rand, y), titel, font=f_titel, fill="#0B3D24")
        stift.text((rand + b + luecke, y + 8), "Rückseite", font=f_klein, fill="#6B7B71")
        for k, seite in ((0, v), (1, r)):
            x = rand + k * (b + luecke)
            bild.paste(seite, (x, y + kopf))
            stift.rectangle([x, y + kopf, x + b - 1, y + kopf + hh - 1], outline="#C6D2C9", width=2)
    if bild.width > breite_ziel:
        h = round(bild.height * breite_ziel / bild.width)
        bild = bild.resize((breite_ziel, h), Image.LANCZOS)
    bild.save(pfad, quality=93, optimize=True)
    return pfad


# ── Druckpaket ────────────────────────────────────────────────────────────────
ANLEITUNG_CSS = f"""
@font-face{{font-family:'Plus Jakarta Sans';src:url('file://{ROOT}/assets/fonts/jakarta-var.woff2') format('woff2');font-weight:200 800;}}
@font-face{{font-family:'Inter';src:url('file://{ROOT}/assets/fonts/inter-var.woff2') format('woff2');font-weight:400 700;}}
*{{margin:0;padding:0;box-sizing:border-box}}
@page{{size:A4;margin:0}}
body{{width:210mm;height:297mm;padding:15mm 18mm;font-family:Inter,sans-serif;color:{INK};
      font-size:3.3mm;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
h1{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:8mm;letter-spacing:-.025em;
    color:{GRUEN};margin-bottom:1.5mm}}
.unter{{color:{GRAU};font-size:3.3mm;margin-bottom:6mm;padding-bottom:4mm;
        border-bottom:.4mm solid {GRUEN}}}
h2{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:4.4mm;color:{GRUEN};
    margin:6mm 0 2.5mm;letter-spacing:-.02em}}
table{{width:100%;border-collapse:collapse}}
td,th{{text-align:left;padding:1.7mm 3mm 1.7mm 0;border-bottom:.2mm solid #DCE4DE;vertical-align:top}}
th{{font-size:2.6mm;letter-spacing:.12em;text-transform:uppercase;color:{GRAU};font-weight:600}}
td.k{{width:42mm;color:{GRAU}}}
code{{font-family:ui-monospace,Menlo,monospace;font-size:3.1mm;background:{CREME};
      padding:.4mm 1.4mm;border-radius:1mm}}
ul{{margin:0 0 0 5mm}} li{{margin-bottom:1.2mm}}
.farbe{{display:inline-block;width:5mm;height:5mm;border-radius:1mm;vertical-align:-1mm;
        margin-right:2mm;border:.2mm solid rgba(0,0,0,.12)}}
.hinweis{{background:{CREME};border-left:1.2mm solid {LIME};padding:3.5mm 4.5mm;margin-top:6mm;
          border-radius:0 2mm 2mm 0}}
.fuss{{font-size:2.8mm;color:{GRAU};border-top:.2mm solid #DCE4DE;
       padding-top:3mm;margin-top:7mm}}
"""


def anleitung_html(entwurf: str) -> str:
    zeilen = "".join(
        f"<tr><td class='k'>{x['vorname']} {x['nachname']}</td>"
        f"<td><code>visitenkarte-{x['vorname'].lower()}.pdf</code></td>"
        f"<td>{x['rolle']}</td></tr>" for x in PERSONEN)
    return f"""<!DOCTYPE html><html><head><meta charset="UTF-8"><style>{ANLEITUNG_CSS}</style></head><body>
<h1>Visitenkarten GreenCareers</h1>
<div class="unter">Druckanleitung · Entwurf „{ENTWUERFE[entwurf]}" · Stand {DATUM} · 5 Personen, je 2 Seiten</div>

<h2>Format</h2>
<table>
  <tr><td class="k">Endformat</td><td><b>85 × 55 mm</b> (quer, DIN-Visitenkarte)</td></tr>
  <tr><td class="k">Datei</td><td><b>91 × 61 mm</b> — enthält bereits <b>3 mm Beschnitt umlaufend</b></td></tr>
  <tr><td class="k">Seiten je Datei</td><td>Seite 1 = Vorderseite · Seite 2 = Rückseite</td></tr>
  <tr><td class="k">Sicherheitsabstand</td><td>5 mm ab Schnittkante, im Layout eingehalten</td></tr>
  <tr><td class="k">Beschnittmarken</td><td>keine — bei diesem Format unüblich, der Beschnitt steckt im Format</td></tr>
</table>

<h2>Dateien und Zuordnung</h2>
<table>
  <tr><th>Person</th><th>Datei</th><th>Rolle auf der Karte</th></tr>
  {zeilen}
</table>

<h2>Farben</h2>
<table>
  <tr><td class="k"><span class="farbe" style="background:{GRUEN}"></span>Dunkelgrün</td><td><code>#0B3D24</code></td><td>Vorderseite vollflächig</td></tr>
  <tr><td class="k"><span class="farbe" style="background:{LIME}"></span>Lime</td><td><code>#CDF47A</code></td><td>Akzent (Rolle, Unterstreichung)</td></tr>
  <tr><td class="k"><span class="farbe" style="background:{CREME}"></span>Off-White</td><td><code>#F2F7F3</code></td><td>Rückseite vollflächig</td></tr>
</table>

<h2>Empfehlung fürs Material</h2>
<ul>
  <li><b>350 g/m² oder stärker</b> — dünner wirkt die Karte auf der Messe billig.</li>
  <li><b>Matt statt glänzend.</b> Die Vorderseite ist vollflächig dunkel; auf glänzendem
      Material sieht man dort jeden Fingerabdruck.</li>
  <li>Wenn im Budget: <b>Soft-Touch-Laminierung</b> — der Effekt ist bei vollflächigem
      Dunkelgrün am größten.</li>
</ul>

<div class="hinweis">
  <b>Zwei Dinge, die eine Rückfrage der Druckerei auslösen können:</b><br>
  1 · Die PDFs sind in <b>RGB</b> angelegt (Digitaldruck-Standard). Für Offset bitte nach
  ISO&nbsp;Coated&nbsp;v2 konvertieren — die Umrechnung macht die Druckerei farbverbindlich,
  bitte nicht selbst umrechnen.<br>
  2 · Der <b>QR-Code auf der Rückseite ist je Person verschieden</b> und darf nicht
  vereinheitlicht werden: er ordnet den Scan dem jeweiligen Vertriebler zu.
  Mindestgröße im Layout 18 mm, bitte nicht verkleinern.
</div>

<div class="fuss">Fragen zu den Druckdaten: hello@green-careers.de · GreenCareers GmbH, Hansaring 61, 50670 Köln</div>
</body></html>"""


def paket(entwurf: str):
    """Vollständiges Druckpaket für einen Entwurf: PDFs, PNGs, Anleitung, Übersicht."""
    ordner = os.path.join(OUT, f"druckpaket-{entwurf}-{ENTWUERFE[entwurf].lower()}")
    os.makedirs(ordner, exist_ok=True)
    css_px = lambda mm: round(mm / 25.4 * 96)
    vorschau = []
    for p in PERSONEN:
        slug = p["vorname"].lower()
        bauen(p, entwurf, os.path.join(ordner, f"visitenkarte-{slug}.pdf"), png=False)
        # Jede Seite einzeln als PNG – ein Bild je Karte, nicht beide übereinander.
        teile = karte(p, entwurf).strip().split("</section>")
        for nr, (kennung, stueck) in enumerate(zip(("1-vorne", "2-hinten"), teile), 1):
            html = (f'<!DOCTYPE html><html><head><meta charset="UTF-8"><style>{CSS}</style></head>'
                    f'<body>{stueck}</section></body></html>')
            src = os.path.join(WORK, f"paket-{slug}-{nr}.html"); open(src, "w", encoding="utf-8").write(html)
            png = os.path.join(ordner, f"visitenkarte-{slug}-{kennung}.png")
            chrome([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                    "--allow-file-access-from-files", "--virtual-time-budget=4000",
                    f"--window-size={css_px(91)},{css_px(61)}", "--force-device-scale-factor=6",
                    f"--screenshot={png}", f"file://{src}"])
        vorschau.append((f"{p['vorname']} {p['nachname']} — {p['rolle']}",
                         Image.open(os.path.join(ordner, f"visitenkarte-{slug}-1-vorne.png")).convert("RGB"),
                         Image.open(os.path.join(ordner, f"visitenkarte-{slug}-2-hinten.png")).convert("RGB")))
        print(f"✓ {p['vorname']} {p['nachname']}  ·  PDF + 2 PNG")

    src = os.path.join(WORK, "druckanleitung.html")
    open(src, "w", encoding="utf-8").write(anleitung_html(entwurf))
    chrome([CHROME, "--headless=new", "--disable-gpu", "--allow-file-access-from-files",
            "--no-pdf-header-footer", "--virtual-time-budget=4000",
            f"--print-to-pdf={os.path.join(ordner, 'druckanleitung.pdf')}", f"file://{src}"])
    print("✓ druckanleitung.pdf")
    blatt(vorschau, os.path.join(ordner, "uebersicht-alle-fuenf.jpg"))
    print("✓ uebersicht-alle-fuenf.jpg")
    print(f"\n→ {os.path.relpath(ordner, ROOT)}")
    return ordner


def main():
    final = "--final" in sys.argv
    gewaehlt = next((a.split("=")[1] for a in sys.argv if a.startswith("--entwurf=")), "1")

    if "--paket" in sys.argv:
        paket(gewaehlt)
        return

    if final:
        # Ohne --entwurf werden alle fünf Sätze gebaut: Freddy kann sofort drucken,
        # egal für welchen Entwurf er sich entscheidet.
        welche = [gewaehlt] if any(a.startswith("--entwurf=") for a in sys.argv) else list(ENTWUERFE)
        for e in welche:
            ordner = os.path.join(OUT, f"druck-{e}-{ENTWUERFE[e].lower()}"); os.makedirs(ordner, exist_ok=True)
            for p in PERSONEN:
                pdf = os.path.join(ordner, f"visitenkarte-{p['vorname'].lower()}.pdf")
                bauen(p, e, pdf, png=False)
            print(f"✓ Entwurf {e} · {ENTWUERFE[e]}  →  {os.path.relpath(ordner, ROOT)}/ (5 PDFs)")
        return

    # Blatt A: alle fünf Entwürfe mit derselben Person – nur so ist Design vergleichbar.
    # Niklas Kühme hat den längsten Namen und die längste Adresse, also den härtesten Satz.
    muster = next(x for x in PERSONEN if x["vorname"] == "Niklas")
    reihen_a = []
    for e in ENTWUERFE:
        png = bauen(muster, e, os.path.join(OUT, f"entwurf-{e}-{ENTWUERFE[e].lower()}.pdf"))
        reihen_a.append((f"{e} · {ENTWUERFE[e]}", *seiten(png)))
        print(f"✓ Entwurf {e} · {ENTWUERFE[e]}")
    blatt(reihen_a, os.path.join(OUT, "entwuerfe-vergleich.jpg"))
    print("✓ print/visitenkarten-v2/entwuerfe-vergleich.jpg")

    # Blatt B: jeder Entwurf mit einer anderen Person – zeigt, dass jeder Satz trägt.
    reihen_b = []
    for e, p in zip(ENTWUERFE, PERSONEN):
        reihen_b.append((f"{e} · {ENTWUERFE[e]} — {p['vorname']} {p['nachname']}", *seiten(bauen(p, e))))
        print(f"✓ Entwurf {e} · {p['vorname']} {p['nachname']}")
    blatt(reihen_b, os.path.join(OUT, "entwuerfe-personen.jpg"))
    print("✓ print/visitenkarten-v2/entwuerfe-personen.jpg")

if __name__ == "__main__":
    main()
