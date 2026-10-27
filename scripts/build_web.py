"""Сборка сайта для Cloudflare: интерфейс + Python-движок для Pyodide + демо-данные.
Скриншоты демо-ленты распознаются заранее локальным Tesseract (data/ocr_cache.json),
загруженные пользователем картинки распознаёт tesseract.js в браузере."""
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from belgi import ocr  # noqa: E402

OUT = ROOT / "deploy" / "cloudflare" / "public"
PY = ["__init__", "normalize", "lexicon", "entities", "geo", "engine", "evaluate", "sources", "crawl", "core", "llm", "ocr", "webapi"]

if OUT.exists():
    shutil.rmtree(OUT)
(OUT / "py" / "belgi").mkdir(parents=True)
(OUT / "py" / "data").mkdir(parents=True)
(OUT / "data" / "img").mkdir(parents=True)

for f in ["app.js", "static.js", "style.css"]:
    shutil.copy(ROOT / "web" / f, OUT / f)
shutil.copytree(ROOT / "web" / "vendor", OUT / "vendor")
for extra in ("pitch", "demo"):
    if (ROOT / "web" / extra).exists():
        shutil.copytree(ROOT / "web" / extra, OUT / extra)
html = (ROOT / "web" / "index.html").read_text(encoding="utf-8")
html = html.replace('<script src="app.js"></script>', '<script src="static.js"></script>\n<script src="app.js"></script>')
(OUT / "index.html").write_text(html, encoding="utf-8")

files = []
for m in PY:
    shutil.copy(ROOT / "belgi" / f"{m}.py", OUT / "py" / "belgi" / f"{m}.py")
    files.append(f"belgi/{m}.py")
shutil.copy(ROOT / "data" / "feed.json", OUT / "py" / "data" / "feed.json")
files.append("data/feed.json")

cache = {}
for img in sorted((ROOT / "data" / "img").glob("*.png")):
    shutil.copy(img, OUT / "data" / "img" / img.name)
    cache[img.name] = ocr.image_text(str(img))
    if not cache[img.name]:
        sys.exit(f"OCR не дал текста для {img.name}: нужен локальный tesseract")
(OUT / "py" / "data" / "ocr_cache.json").write_text(json.dumps(cache, ensure_ascii=False, indent=1), encoding="utf-8")
files.append("data/ocr_cache.json")
(OUT / "py" / "manifest.json").write_text(json.dumps(files), encoding="utf-8")

# Демо-лента разбирается одними правилами, результат всегда один и тот же. Считаем его заранее:
# пока Python-движок грузится в браузер (на медленном Wi-Fi до 25 с), итог по демо-ленте виден сразу.
import time  # noqa: E402
from belgi import webapi as W  # noqa: E402
W.reset()
t0 = time.perf_counter()
scan = json.loads(W.scan_demo(50, ""))
scan["elapsed"] = round(max(0.01, time.perf_counter() - t0), 2)
pre = {"scan": scan, "graph": {"": json.loads(W.graph("")), "shymkent": json.loads(W.graph("shymkent"))},
       "metrics": json.loads(W.metrics()), "cases": {c["id"]: json.loads(W.case(c["id"])) for c in scan["cases"]}}
(OUT / "py" / "demo.json").write_text(json.dumps(pre, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
W.reset()
# та же сборка для версии на Cloudflare Pages
PAGES = ROOT / "deploy" / "pages" / "public"
if PAGES.exists():
    shutil.rmtree(PAGES)
shutil.copytree(OUT, PAGES)
print("собрано:", OUT, "и", PAGES, len(list(OUT.rglob("*"))), "файлов")
