"""Тот же API, что у сервера, но для запуска в браузере (Pyodide). Сеть, OCR и LLM
делает JavaScript; здесь только разбор и анализ. Все функции принимают и отдают JSON-строки."""
import json
import uuid
from datetime import datetime

from . import core, engine, geo, lexicon as lx, llm, sources

S = core.new_state()
_llm_codes = {}


def _j(x):
    return json.dumps(x, ensure_ascii=False)


def _scan_result(new, done=False, elapsed=0.0):
    return {"found": len(new), "elapsed": round(elapsed, 2), "done": done, "llm_used": 0,
            "images": sum(1 for r in new if r.get("image") or r.get("image_url")),
            "new_ids": [r["id"] for r in new], "cases": core.sorted_views(S), "stats": core.stats(S)}


def status(llm_on=False, llm_label=""):
    return _j({"ocr": True, "llm": bool(llm_on), "llm_model": llm_label or "выключена",
               "tracks": lx.TRACKS, "stats": core.stats(S),
               "city": {"id": geo.CITY, "label": geo.CITY_RU, "seeds": geo.SEEDS}})


def scan_demo(limit=10, platform=None):
    posts, done = S["demo"].fetch(max(1, min(int(limit), 50)), platform or None)
    for p in posts:
        if p.get("image"):
            p["image_url"] = "data/img/" + p["image"].rsplit("/", 1)[-1]
    new = core.process(S, posts)
    return _j(_scan_result(new, done))


def parse_tg(html_text, channel, limit=10):
    return _j(sources.parse_telegram_html(html_text, sources.clean_channel(channel), int(limit)))


def ingest(posts_json):
    """Посты, уже подготовленные в JS (текст, ocr_text, image_url)."""
    new = core.process(S, json.loads(posts_json))
    return _j(_scan_result(new))


def crawl_channel(name, parent, posts_json, local=False):
    new = core.process(S, json.loads(posts_json))
    entry, refs = core.crawl_entry(name, parent or None, new, bool(local))
    return _j({"entry": entry, "refs": refs})


def manual(text, ocr_text="", image_url="", demo=False):
    cid = "man_" + uuid.uuid4().hex[:6]
    post = {"id": cid, "platform": "manual", "kind": "manual", "account": "Ручная проверка",
            "ts": datetime.now().isoformat(timespec="minutes"), "text": (text or "")[:6000], "demo": bool(demo)}
    if ocr_text:
        post["ocr_text"] = ocr_text
        post["image"] = "upload"
    if image_url:
        post["image_url"] = image_url
    core.process(S, [post])
    return cid


def llm_requests(ids_json):
    out = []
    for cid in json.loads(ids_json):
        r = S["results"].get(cid)
        req = llm.build_request(r) if r else None
        if req:
            messages, schema, codes = req
            _llm_codes[cid] = codes
            out.append({"id": cid, "messages": messages, "schema": schema})
    return _j(out)


def llm_apply(cid, content, seconds, model=""):
    r = S["results"].get(cid)
    if not r or cid not in _llm_codes:
        return False
    return llm.apply_response(r, content, _llm_codes.pop(cid), float(seconds), model)


def ocr_pending():
    """Посты из Telegram, картинку которых браузер ещё не распознал."""
    return _j([{"id": cid, "image_url": r.get("image_url")} for cid, r in S["results"].items() if r.get("ocr_pending")])


def ocr_apply(cid, text):
    r = core.reanalyze(S, cid, text)
    return _j(core.view(r, False) if r else None)


def cases():
    return _j({"cases": core.sorted_views(S), "stats": core.stats(S)})


def case(cid):
    r = S["results"].get(cid)
    return _j(core.view(r)) if r else _j({"error": "Нет такого кейса"})


def feedback(cid, verdict):
    return _j({"ok": True, "feedback": core.feedback(S, cid, verdict)})


def reset():
    S["results"].clear()
    S["posts"].clear()
    S["demo"].reset()
    return _j({"ok": True})


def graph(city=""):
    return _j(core.graph(S, city or None))


def metrics():
    return _j(core.metrics())


def report(cid):
    r = S["results"].get(cid)
    return core.report_html(r) if r else "<p>Нет такого кейса</p>"
