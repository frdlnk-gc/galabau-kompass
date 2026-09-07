#!/usr/bin/env python3
"""Blanko-Polo-Mockups (Vorder-/Rückansicht, schwarz, ohne Aufdruck) per gpt-image-2 für die Design-Vorschau."""
import base64, json, os, sys, time, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "print", "_mockup"); os.makedirs(OUT, exist_ok=True)
key = os.environ.get("OPENAI_API_KEY") or sys.exit("OPENAI_API_KEY fehlt")
BASE = ("Product photo of a plain black cotton pique polo shirt on an invisible ghost mannequin, {view}, centered, studio lighting, soft shadows, "
        "seamless light grey background, absolutely no logos, no text, no labels, no prints, no embroidery, plain fabric with natural folds, "
        "collar and three-button placket, short sleeves, photorealistic, high detail, e-commerce style.")
JOBS = {"polo-front": BASE.format(view="front view showing collar, placket and chest area"), "polo-back": BASE.format(view="back view showing the full back panel and collar from behind")}
for name, prompt in JOBS.items():
    body = json.dumps({"model": "gpt-image-2", "prompt": prompt, "size": "1024x1536", "quality": "high", "n": 1}).encode()
    req = urllib.request.Request("https://api.openai.com/v1/images/generations", data=body, headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"})
    t = time.time()
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                j = json.load(r); open(os.path.join(OUT, name + ".png"), "wb").write(base64.b64decode(j["data"][0]["b64_json"])); print("✓", name, f"{time.time()-t:.0f}s"); break
        except Exception as e:
            print("Fehler", name, str(e)[:160]); time.sleep(6)
