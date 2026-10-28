"""Локальная LLM для спорных случаев (llama-server, Qwen3.5-Kazakh от ISSAI).
Модель не выносит вердикт: она только находит признаки из списка и приводит
дословную цитату. Цитата, которой нет в тексте, отбрасывается."""
import json
import os
import re
import time

from . import engine
from . import lexicon as lx

# По умолчанию локальный llama-server. Для облака: BELGI_LLM_URL (OpenAI-совместимый адрес
# до /v1), BELGI_LLM_KEY и BELGI_LLM_MODEL; BELGI_LLM=off выключает LLM совсем.
URL = os.environ.get("BELGI_LLM_URL", "http://127.0.0.1:8081").rstrip("/")
KEY = os.environ.get("BELGI_LLM_KEY", "")
MODEL = os.environ.get("BELGI_LLM_MODEL", "")
OFF = os.environ.get("BELGI_LLM", "").lower() == "off"
LOCAL = not KEY
MODEL_NAME = os.environ.get("BELGI_LLM_LABEL", "Qwen3.5-9B-Kazakh (ISSAI), локально" if LOCAL else MODEL)
GREY = (0, engine.HIGH)        # спорная зона по баллам
_health = {"t": 0, "ok": False}

SYSTEM = ("Ты помощник аналитика, который ищет признаки незаконных схем в публикациях соцсетей Казахстана "
          "на русском и казахском. Найди в тексте признаки ТОЛЬКО из данного списка. Для каждого найденного "
          "признака приведи короткую дословную цитату из текста (3–12 слов, без изменений). Не делай выводов "
          "о законности и не придумывай признаки, которых нет. Ответь только JSON.")


def available():
    if OFF:
        return False
    if not LOCAL:
        return True
    if time.time() - _health["t"] < 10:
        return _health["ok"]
    import httpx
    try:
        _health["ok"] = httpx.get(URL + "/health", timeout=0.5).status_code == 200
    except httpx.HTTPError:
        _health["ok"] = False
    _health["t"] = time.time()
    return _health["ok"]


def _grey_tracks(r):
    if r["level"] == "high" or "X_NEWS" in r["counters"]:
        return []
    strong_counter = {c["track"] for c in r["counters"].values() if c["weight"] <= -40}
    # без реквизитов или контакта (новости, речи, посты со ссылкой на свой же канал) LLM не зовём
    if not engine.actionable(r):
        return []
    return [t for t, v in r["tracks"].items()
            if r["ctx"][t] and GREY[0] <= v["score"] < GREY[1] and t not in strong_counter]


def build_request(r):
    """Запрос к LLM для спорного случая или None. Возвращает (messages, schema, codes)."""
    tracks = _grey_tracks(r)
    if not tracks:
        return None
    codes = [c for c, f in lx.FEATURES.items() if f[0] in tracks and c not in r["found"] and not c.endswith("w")]
    if not codes:
        return None
    text = "\n".join(f"[{s['src']}] {s['text']}" for s in r["segments"] if s["text"].strip())[:3000]
    catalog = "\n".join(f"{c}: {lx.FEATURES[c][1]}" for c in codes)
    schema = {"type": "object", "properties": {"features": {"type": "array", "items": {
        "type": "object", "properties": {"code": {"type": "string", "enum": codes},
                                         "quote": {"type": "string"}}, "required": ["code", "quote"]}}},
              "required": ["features"]}
    messages = [{"role": "system", "content": SYSTEM},
                {"role": "user", "content": f"Список признаков:\n{catalog}\n\nПубликация:\n{text}"}]
    return messages, schema, codes


def apply_response(r, content, codes, seconds, model=None):
    """Принять ответ LLM: оставить только признаки с цитатой, которая есть в тексте."""
    try:
        data = json.loads(re.sub(r"^.*?(\{)", r"\1", content, flags=re.S)) if isinstance(content, str) else content
    except (ValueError, TypeError):
        return False
    before = r["level"]
    added, rejected = [], 0
    for item in (data.get("features") or [])[:6]:
        code, quote = item.get("code"), (item.get("quote") or "").strip()
        loc = _locate(r["segments"], quote)
        if code not in codes or not loc:
            rejected += 1
            continue
        t, title, w, norm, _ = lx.FEATURES[code]
        seg_i, s, e = loc
        seg = r["segments"][seg_i]
        r["found"][code] = {"code": code, "track": t, "title": title, "weight": w, "norm": lx.NORMS.get(norm, norm),
                            "quotes": [{"text": seg["text"][s:e], "src": seg["src"], "t": seg.get("t"), "seg": seg_i,
                                        "start": s, "end": e}], "detail": "найдено LLM, цитата сверена с текстом", "llm": True}
        added.append(code)
    engine.score_tracks(r)
    # LLM сдвигает уровень максимум на одну ступень
    lo, hi = engine.LEVELS.index(before), engine.LEVELS.index(r["level"])
    if hi - lo > 1:
        r["level"] = engine.LEVELS[lo + 1]
    r["llm"] = {"model": model or MODEL_NAME, "added": added, "rejected": rejected, "seconds": round(seconds, 1),
                "before": before, "after": r["level"]}
    return True


def review(r):
    req = build_request(r)
    if not req:
        return False
    messages, schema, codes = req
    import httpx
    body = {"messages": messages, "temperature": 0, "max_tokens": 400,
            "response_format": {"type": "json_schema", "json_schema": {"name": "features", "schema": schema}}}
    if LOCAL:
        body["chat_template_kwargs"] = {"enable_thinking": False}
    if MODEL:
        body["model"] = MODEL
    headers = {"Authorization": f"Bearer {KEY}"} if KEY else {}
    path = "/v1/chat/completions" if LOCAL else "/chat/completions"
    t0 = time.perf_counter()
    try:
        resp = httpx.post(URL + path, json=body, headers=headers, timeout=60)
        content = resp.json()["choices"][0]["message"]["content"]
    except Exception:
        return False
    return apply_response(r, content, codes, time.perf_counter() - t0)


def _locate(segments, quote):
    if len(quote) < 4:
        return None
    q = re.sub(r"\s+", " ", quote.lower()).strip(" «»\"'.,!")
    for i, seg in enumerate(segments):
        flat = seg["text"].lower()
        # пробелы в тексте могут отличаться от цитаты: сравниваем без лишних пробелов
        pattern = r"\s+".join(re.escape(w) for w in q.split())
        m = re.search(pattern, flat)
        if m:
            return i, m.start(), m.end()
    return None
