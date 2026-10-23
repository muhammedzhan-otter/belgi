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
PY = ["__init__", "normalize", "lexicon", "entities", "engine", "evaluate", "sources", "crawl", "core", "llm", "ocr", "webapi"]

if OUT.exists():
    shutil.rmtree(OUT)
(OUT / "py" / "belgi").mkdir(parents=True)
(OUT / "py" / "data").mkdir(parents=True)
(OUT / "data" / "img").mkdir(parents=True)

for f in ["app.js", "static.js", "style.css"]:
    shutil.copy(ROOT / "web" / f, OUT / f)
shutil.copytree(ROOT / "web" / "vendor", OUT / "vendor")
if (ROOT / "web" / "pitch").exists():
    shutil.copytree(ROOT / "web" / "pitch", OUT / "pitch")
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
# та же сборка для версии на Cloudflare Pages
PAGES = ROOT / "deploy" / "pages" / "public"
if PAGES.exists():
    shutil.rmtree(PAGES)
shutil.copytree(OUT, PAGES)
print("собрано:", OUT, "и", PAGES, len(list(OUT.rglob("*"))), "файлов")
