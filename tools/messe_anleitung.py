#!/usr/bin/env python3
"""Messe-Anleitung GaLaBau 2026 für Julian und Liam (zum Weitergeben an Nick, Niklas, Fabio).

Freddys Vorgabe (08.09.): „relativ einfach, nicht zu viel Blabla" — was wir machen, wie der
Ablauf ist, und jeder findet seinen persönlichen Link zum Scannen und Kopieren.

Zwei Seiten:
  1 · Was wir machen + Ablauf
  2 · Persönliche Links, je Person QR (aufs Handy scannen) und Klartext (zum Kopieren)

Die Tokens stehen im Klartext auf Seite 2 — gewollt, weil Julian und Liam die Anleitung
weitergeben. Jeder nimmt seine eigene Zeile; der Hinweis dazu steht auf der Seite.

Aufruf:  python3 tools/messe_anleitung.py
Ausgabe: print/messe-anleitung/messe-anleitung-galabau-2026.pdf
"""
import io, os, subprocess
import segno

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT = os.path.join(ROOT, "print", "messe-anleitung"); os.makedirs(OUT, exist_ok=True)

GRUEN, LIME, CREME, INK, GRAU = "#0B3D24", "#CDF47A", "#F2F7F3", "#0E1B13", "#6B7B71"
DOMAIN = "galabau-kompass.de"

# Tokens aus messe_vertriebler (Supabase greencareers-tracking, geprüft 08.09.).
# polo=True → trägt ein Kompass-Polo mit eigenem QR auf dem Rücken.
# Stand Call 07.09.: nur Nick, Fabio und Niklas tragen Polo; Julian und Liam sind im
# GreenCareers-Shirt unterwegs. Ändert sich das, hier umstellen – der Text zieht mit.
PERSONEN = [
    {"vorname": "Nick",   "name": "Nick Scheffler",   "slug": "nick",   "token": "4089d53a0c07695d", "polo": True},
    {"vorname": "Niklas", "name": "Niklas Kühme",     "slug": "niklas", "token": "c3b3bacc5b11c32b", "polo": True},
    {"vorname": "Fabio",  "name": "Fabio Zindel",     "slug": "fabio",  "token": "5988e9dcb3b57d87", "polo": True},
    {"vorname": "Julian", "name": "Julian Kohansal",  "slug": "julian", "token": "93335fb70b09f1c3", "polo": False},
    {"vorname": "Liam",   "name": "Liam Quick",       "slug": "liam",   "token": "4aba2028bde78305", "polo": False},
]

def umfrage_link(p): return f"https://{DOMAIN}/umfrage/?t={p['token']}"

def qr(url, farbe=INK, scale=10):
    q = segno.make(url, error="m"); buf = io.BytesIO()
    q.save(buf, kind="svg", xmldecl=False, svgns=True, scale=scale, border=0, dark=farbe,
           light=None, svgclass=None, lineclass=None, omitsize=True)
    return buf.getvalue().decode()

CSS = f"""
@font-face{{font-family:'Plus Jakarta Sans';src:url('file://{ROOT}/assets/fonts/jakarta-var.woff2') format('woff2');font-weight:200 800;}}
@font-face{{font-family:'Inter';src:url('file://{ROOT}/assets/fonts/inter-var.woff2') format('woff2');font-weight:400 700;}}
*{{margin:0;padding:0;box-sizing:border-box}}
@page{{size:A4;margin:0}}
body{{font-family:Inter,sans-serif;color:{INK};-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.seite{{width:210mm;height:297mm;padding:16mm 18mm;position:relative;page-break-after:always;
        display:flex;flex-direction:column}}
.seite:last-child{{page-break-after:auto}}
h1{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:9mm;letter-spacing:-.03em;
    color:{GRUEN};line-height:1.05}}
.unter{{color:{GRAU};font-size:3.5mm;margin-top:2mm;padding-bottom:5mm;
        border-bottom:.5mm solid {GRUEN}}}
h2{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:5mm;color:{GRUEN};
    margin:6.5mm 0 2.5mm;letter-spacing:-.02em}}
p{{font-size:3.6mm;line-height:1.55}}
.satz{{background:{GRUEN};color:#fff;border-radius:3mm;padding:5mm 6mm;margin-top:3mm}}
.satz .lab{{font-size:2.6mm;letter-spacing:.14em;text-transform:uppercase;color:{LIME};
            font-weight:700;margin-bottom:2.5mm}}
.satz .text{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:4.9mm;
             line-height:1.32;letter-spacing:-.02em}}
ol.ablauf{{list-style:none;counter-reset:s;margin-top:1mm}}
ol.ablauf li{{counter-increment:s;position:relative;padding-left:11mm;margin-bottom:3.6mm}}
ol.ablauf li::before{{content:counter(s);position:absolute;left:0;top:-.6mm;width:7.5mm;height:7.5mm;
     border-radius:50%;background:{LIME};color:{GRUEN};font-weight:800;font-size:3.6mm;
     display:flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',sans-serif}}
ol.ablauf > li > b{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:3.9mm;
             display:block;margin-bottom:.8mm}}
ol.ablauf span b{{font-weight:700}}
ol.ablauf span{{font-size:3.5mm;line-height:1.5;color:#33443A}}
.kasten{{background:{CREME};border-left:1.4mm solid {LIME};border-radius:0 2.5mm 2.5mm 0;
         padding:4.5mm 5.5mm;margin-top:auto}}
.kasten b{{font-family:'Plus Jakarta Sans',sans-serif}}
.person{{display:flex;align-items:center;gap:7mm;padding:5.5mm 0;
         border-bottom:.25mm solid #DCE4DE}}
.person:last-child{{border-bottom:0}}
.person .qrbox{{width:27mm;height:27mm;flex:none}}
.person .qrbox svg{{display:block;width:100%;height:100%}}
.person .wer{{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:4.6mm;
              color:{GRUEN};letter-spacing:-.02em}}
.person .rolle{{font-size:2.8mm;color:{GRAU};margin-top:.8mm}}
.person .link{{font-family:ui-monospace,Menlo,monospace;font-size:3mm;color:{INK};
               background:{CREME};padding:1.8mm 2.5mm;border-radius:1.5mm;margin-top:2.2mm;
               word-break:break-all;line-height:1.4}}
.fuss{{margin-top:6mm;padding-top:3mm;border-top:.25mm solid #DCE4DE;font-size:2.9mm;color:{GRAU}}}
"""

def seite1():
    traeger = [p["vorname"] for p in PERSONEN if p["polo"]]
    polo_satz = (f"{', '.join(traeger[:-1])} und {traeger[-1]} tragen das Kompass-Polo mit "
                 f"eigenem QR-Code auf dem Rücken.") if len(traeger) > 1 else (
                 f"{traeger[0]} trägt das Kompass-Polo mit eigenem QR-Code auf dem Rücken."
                 if traeger else "")
    return f"""
<section class="seite">
  <h1>GaLaBau 2026 ·<br>So gehen wir vor</h1>
  <div class="unter">Für Julian, Liam, Nick, Niklas und Fabio · 15.–18. September, Nürnberg</div>

  <h2>Was wir machen</h2>
  <p>Wir machen eine <b>Branchenumfrage zur Mitarbeitergewinnung</b> für unser Magazin
  <b>GaLaBau Kompass</b>, in Kooperation mit GreenCareers. 15 kurze Fragen, rund zwei Minuten.
  Die Ergebnisse veröffentlichen wir im Oktober — anonymisiert und branchenweit.</p>
  <p style="margin-top:3mm">Das ist der Aufhänger für jedes Gespräch. <b>Ziel: so viele
  Umfragen wie möglich.</b></p>

  <div class="satz">
    <div class="lab">So sprichst du an</div>
    <div class="text">„Wir machen gerade eine Umfrage für unser Magazin, den GaLaBau Kompass,
    zum Thema Mitarbeitergewinnung. Möchten Sie mitmachen? Dauert zwei Minuten.“</div>
  </div>

  <h2>Der Ablauf</h2>
  <ol class="ablauf">
    <li><b>Ansprechen und die Umfrage auf deinem Handy ausfüllen</b>
        <span>Du hältst das Handy, du tippst — der Betrieb antwortet nur. Das geht schneller
        und ihr bleibt im Gespräch. Deinen Link findest du auf der nächsten Seite.</span></li>
    <li><b>Dankeschön: der Standort-Check</b>
        <span>Kostenlos, zeigt wie viele Fachkräfte im Umkreis des Betriebs wohnen. Wird nach
        dem Absenden der Umfrage per E-Mail zugeschickt.</span></li>
    <li><b>Visitenkarte mitgeben</b>
        <span>Immer. Wer gerade keine Zeit hat: „Auf der Karte ist ein QR-Code, damit können
        Sie die Umfrage in Ruhe nachholen — würde uns sehr helfen.“ Der Code führt an dieselbe
        Stelle wie dein Polo und ist <b>deiner</b>, auch wenn erst Wochen später gescannt
        wird.</span></li>
    <li><b>Der QR auf dem Polo läuft nebenher</b>
        <span>{polo_satz} Wer euch von Weitem sieht und es interessant findet, scannt den Code
        und landet direkt in der Umfrage — ganz ohne Gespräch. Auch dieser Code ist
        <b>persönlich</b>.</span></li>
    <li><b>Nach der Messe</b>
        <span>Jeder Kontakt liegt am Montag, 21. September, als Task für dich in Close.
        Tracking und Auswertung laufen vollständig — das gehen wir gemeinsam durch.</span></li>
  </ol>

  <div class="kasten">
    <p><b>Alle drei Codes sind auf dich personalisiert:</b> dein Umfrage-Link, der QR auf
    deinem Polo und der QR auf deinen Visitenkarten. Jede Eintragung ist damit eindeutig
    deine — egal ob sofort oder Wochen später. <b>Nimm deshalb immer deinen eigenen Link</b>,
    nicht den von jemand anderem.</p>
  </div>
</section>"""

def seite2():
    zeilen = []
    for p in PERSONEN:
        link = umfrage_link(p)
        rolle = ("Kompass-Polo mit eigenem QR auf dem Rücken · eigene Visitenkarten"
                 if p["polo"] else "GreenCareers-Shirt · eigene Visitenkarten")
        zeilen.append(f"""
  <div class="person">
    <div class="qrbox">{qr(link)}</div>
    <div>
      <div class="wer">{p['name']}</div>
      <div class="rolle">{rolle}</div>
      <div class="link">{link}</div>
    </div>
  </div>""")
    return f"""
<section class="seite">
  <h1>Dein Umfrage-Link</h1>
  <div class="unter">QR mit dem Handy scannen · dann als Lesezeichen oder auf den Startbildschirm legen</div>
  <p style="margin-top:6mm">Suche deine Zeile, scanne den QR-Code mit der Handykamera — der
  Link öffnet sich direkt. Oben in der Umfrage muss <b>dein Vorname</b> stehen
  („Aufgenommen von …“). Wenn dort ein anderer Name steht, hast du den falschen Link erwischt.</p>
  {''.join(zeilen)}
  <div class="fuss">Fragen vor Ort: Julian oder Liam · Technische Fragen: hello@green-careers.de</div>
</section>"""

def main():
    html = (f'<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">'
            f'<style>{CSS}</style></head><body>{seite1()}{seite2()}</body></html>')
    src = os.path.join(ROOT, "print", "_work", "messe-anleitung.html")
    os.makedirs(os.path.dirname(src), exist_ok=True)
    open(src, "w", encoding="utf-8").write(html)
    pdf = os.path.join(OUT, "messe-anleitung-galabau-2026.pdf")
    for versuch in range(3):
        try:
            subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--allow-file-access-from-files",
                            "--no-pdf-header-footer", "--virtual-time-budget=6000",
                            f"--print-to-pdf={pdf}", f"file://{src}"],
                           check=True, capture_output=True, timeout=120)
            break
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError):
            if versuch == 2: raise
    print(f"✓ {os.path.relpath(pdf, ROOT)}")

if __name__ == "__main__":
    main()
