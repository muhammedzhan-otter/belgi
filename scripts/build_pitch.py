"""Открытая версия презентации: слайды из pitch/ (те же, что в презентации Claude) собираются
в одну страницу web/pitch/index.html с листанием, полноэкранным режимом и заметками (клавиша N)."""
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "pitch"
OUT = ROOT / "web" / "pitch"

deck = json.loads((SRC / "deck.json").read_text(encoding="utf-8"))
blobs = json.loads((SRC / "blobs.json").read_text(encoding="utf-8"))
fonts = "&".join(f["href"].split("?", 1)[1].replace("&display=swap", "") for f in deck["faces"].values())

slides = []
for sid in deck["order"]:
    html = (SRC / "slides" / f"{sid}.html").read_text(encoding="utf-8")
    html = re.sub(r"/_blob/([0-9a-f]{32})", lambda m: "img/" + blobs[m.group(1)], html)
    slides.append(f'<div class="slide" data-id="{sid}">{html}</div>')

page = f"""<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{deck["title"]}</title>
<meta name="description" content="Презентация проекта Белгі для хакатона SafeNet KZ: признаки незаконных розыгрышей, рекламы казино и финансовых пирамид в соцсетях Казахстана.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?{fonts}&display=swap">
<style>
  * {{ box-sizing: border-box; }}
  html, body {{ margin: 0; height: 100%; background: #070c18; overflow: hidden; font-family: Inter, Arial, sans-serif; }}
  #viewport {{ position: fixed; inset: 0; }}
  #stage {{ position: absolute; left: 50%; top: 50%; width: 1920px; height: 1080px; transform-origin: 0 0; }}
  .slide {{ position: absolute; inset: 0; display: none; }}
  .slide.on {{ display: block; animation: fade .35s ease; }}
  @keyframes fade {{ from {{ opacity: 0; }} to {{ opacity: 1; }} }}
  .slide > section {{ position: relative; width: 1920px; height: 1080px; overflow: hidden; }}
  .slide h1, .slide h2, .slide h3, .slide p {{ margin: 0; }}
  .slide img, .slide svg {{ display: block; }}
  .slide table {{ width: 100%; border-collapse: collapse; overflow: hidden; }}
  .slide th, .slide td {{ padding: 14px 22px; text-align: left; vertical-align: top; border-bottom: 1px solid #E1E6EF; }}
  .slide aside {{ display: none; }}
  #bar {{ position: fixed; left: 50%; bottom: 14px; transform: translateX(-50%); display: flex; gap: 6px; align-items: center;
    background: rgba(15, 23, 42, .78); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,.12); border-radius: 999px;
    padding: 6px 8px; color: #dbe4f5; font-size: 14px; z-index: 5; transition: opacity .3s; }}
  #bar button, #bar a {{ background: none; border: 0; color: #dbe4f5; font: inherit; cursor: pointer; padding: 6px 10px; border-radius: 999px; text-decoration: none; }}
  #bar button:hover, #bar a:hover {{ background: rgba(255,255,255,.12); }}
  #count {{ min-width: 56px; text-align: center; font-variant-numeric: tabular-nums; }}
  #notes {{ position: fixed; left: 50%; bottom: 64px; transform: translateX(-50%); width: min(900px, 92vw); max-height: 40vh; overflow: auto;
    background: rgba(15, 23, 42, .92); color: #e6ecf7; border: 1px solid rgba(255,255,255,.14); border-radius: 14px; padding: 14px 18px;
    font-size: 16px; line-height: 1.5; display: none; z-index: 6; }}
  #notes.on {{ display: block; }}
  #rotate {{ position: fixed; inset: auto 12px 64px 12px; text-align: center; color: #b8c4da; font-size: 13px; display: none; }}
  @media (orientation: portrait) and (max-width: 700px) {{ #rotate {{ display: block; }} }}
  body.idle #bar {{ opacity: 0; }}
</style>
</head>
<body>
<div id="viewport"><div id="stage">
{chr(10).join(slides)}
</div></div>
<div id="notes"></div>
<div id="rotate">Поверните телефон горизонтально, так слайды будут крупнее</div>
<div id="bar">
  <button id="prev" aria-label="Назад">&#8592;</button>
  <span id="count"></span>
  <button id="next" aria-label="Вперёд">&#8594;</button>
  <button id="notesBtn" title="Заметки выступающего (N)">Заметки</button>
  <button id="fs" title="Во весь экран (F)">Во весь экран</button>
  <a href="/" title="Открыть Белгі">Открыть Белгі</a>
</div>
<script>
const slides = [...document.querySelectorAll(".slide")];
const stage = document.getElementById("stage");
let i = Math.max(0, Math.min(slides.length - 1, (parseInt(location.hash.slice(1)) || 1) - 1));
function fit() {{
  const s = Math.min(innerWidth / 1920, innerHeight / 1080);
  stage.style.transformOrigin = "50% 50%";
  stage.style.transform = `translate(-50%, -50%) scale(${{s}})`;
}}
function show(n) {{
  i = Math.max(0, Math.min(slides.length - 1, n));
  slides.forEach((s, k) => s.classList.toggle("on", k === i));
  document.getElementById("count").textContent = `${{i + 1}} / ${{slides.length}}`;
  const a = slides[i].querySelector("aside");
  document.getElementById("notes").textContent = a ? a.textContent : "";
  history.replaceState(null, "", "#" + (i + 1));
}}
document.getElementById("prev").onclick = () => show(i - 1);
document.getElementById("next").onclick = () => show(i + 1);
document.getElementById("notesBtn").onclick = () => document.getElementById("notes").classList.toggle("on");
document.getElementById("fs").onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
addEventListener("keydown", (e) => {{
  if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) {{ e.preventDefault(); show(i + 1); }}
  if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) {{ e.preventDefault(); show(i - 1); }}
  if (e.key === "Home") show(0);
  if (e.key === "End") show(slides.length - 1);
  if (e.key.toLowerCase() === "n" || e.key === "т") document.getElementById("notes").classList.toggle("on");
  if (e.key.toLowerCase() === "f" || e.key === "а") document.getElementById("fs").click();
}});
let x0 = null;
addEventListener("touchstart", (e) => {{ x0 = e.touches[0].clientX; }}, {{ passive: true }});
addEventListener("touchend", (e) => {{
  if (x0 === null) return;
  const dx = e.changedTouches[0].clientX - x0;
  if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1));
  x0 = null;
}});
document.getElementById("viewport").addEventListener("click", (e) => {{
  if (e.target.closest("a")) return;
  show(i + (e.clientX > innerWidth / 3 ? 1 : -1));
}});
let idle;
addEventListener("mousemove", () => {{ document.body.classList.remove("idle"); clearTimeout(idle); idle = setTimeout(() => document.body.classList.add("idle"), 2500); }});
addEventListener("resize", fit);
fit(); show(i);
</script>
</body>
</html>
"""

if OUT.exists():
    shutil.rmtree(OUT)
(OUT / "img").mkdir(parents=True)
for f in (SRC / "img").glob("*.png"):
    shutil.copy(f, OUT / "img" / f.name)
(OUT / "index.html").write_text(page, encoding="utf-8")
print("собрано:", OUT / "index.html", len(slides), "слайдов")
