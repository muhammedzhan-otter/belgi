"""Общая логика над состоянием одной сессии: и для сервера (FastAPI), и для браузера (Pyodide)."""
import html
from datetime import datetime, timedelta, timezone

from . import engine, evaluate, geo, lexicon as lx

MAX_RESULTS = 600


def new_state():
    from . import sources
    return {"results": {}, "posts": {}, "demo": sources.DemoSource(), "busy": False}


def process(S, posts):
    new = []
    for p in posts:
        if p["id"] in S["results"] or len(S["results"]) >= MAX_RESULTS:
            continue
        evaluate.prepare(p)
        r = engine.analyze(p)
        if p.get("image_url"):
            r["image_url"] = p["image_url"]
        # картинка поста из Telegram, которую браузер ещё не распознал (дочитывается в фоне)
        r["ocr_pending"] = p.get("image") == "tg" and not p.get("ocr_done")
        S.setdefault("posts", {})[r["id"]] = p
        S["results"][r["id"]] = r
        new.append(r)
    engine.apply_network(list(S["results"].values()))
    return new


def reanalyze(S, cid, ocr_text):
    """Пост с картинкой, которую распознали позже: разобрать заново с текстом со скриншота."""
    p, old = S.get("posts", {}).get(cid), S["results"].get(cid)
    if not p or not old:
        return None
    p = dict(p, ocr_text=ocr_text or "", ocr_done=True)
    S["posts"][cid] = p
    r = engine.analyze(p)
    r["image_url"] = old.get("image_url")
    r["ocr_pending"] = False
    if old.get("feedback"):
        r["feedback"] = old["feedback"]
    S["results"][cid] = r
    engine.apply_network(list(S["results"].values()))
    return r


def view(r, full=True):
    v = engine.public_view(r, full)
    v["image_url"] = r.get("image_url")
    v["ocr_pending"] = r.get("ocr_pending", False)
    return v


def _ts(v):
    try:
        return datetime.fromisoformat(v["ts"]).timestamp()
    except (TypeError, ValueError):
        return 0


def sorted_views(S):
    rows = [view(r, False) for r in S["results"].values()]
    # при равном риске свежие выше
    rows.sort(key=lambda v: (-engine.LEVELS.index(v["level"]), -v["score"], -_ts(v), v["id"]))
    return rows


def stats(S):
    rs = list(S["results"].values())
    return {"total": len(rs), "levels": {lv: sum(1 for r in rs if r["level"] == lv) for lv in engine.LEVELS},
            "tracks": {t: sum(1 for r in rs if r["track"] == t and r["level"] != "low") for t in lx.TRACKS},
            "links": sum(1 for r in rs if r["network"]),
            "cities": {c or "none": sum(1 for r in rs if r["geo"]["city"] == c) for c in (geo.CITY, "other", "kz", None)}}


def feedback(S, cid, verdict):
    r = S["results"].get(cid)
    if not r or verdict not in ("confirmed", "false_positive", "sent"):
        return None
    r["feedback"] = {"verdict": verdict, "at": datetime.now().strftime("%H:%M")}
    return r["feedback"]


def graph(S, city=None):
    rs = [r for r in S["results"].values() if not city or r["geo"]["city"] == city]
    nodes, edges, seen, acc_level, acc_demo = [], [], set(), {}, {}
    for r in rs:
        acc_level[r["account"]] = max(acc_level.get(r["account"], 0), engine.LEVELS.index(r["level"]))
        acc_demo[r["account"]] = acc_demo.get(r["account"], True) and bool(r.get("demo"))
    for r in rs:
        for link in r["network"]:
            a = r["account"]
            if a not in seen:
                seen.add(a)
                nodes.append({"data": {"id": "a:" + a, "label": a, "kind": "account", "demo": acc_demo[a],
                                       "level": engine.LEVELS[acc_level[a]], "track": r["track"] or ""}})
            eid = link["id"]
            if eid not in seen:
                seen.add(eid)
                nodes.append({"data": {"id": eid, "label": link["entity"], "kind": link["type"]}})
            key = ("a:" + a, eid)
            if key not in seen:
                seen.add(key)
                edges.append({"data": {"id": f"e{len(edges)}", "source": "a:" + a, "target": eid, "post": r["id"]}})
    return {"nodes": nodes, "edges": edges}


_metrics = {}


def metrics():
    if "m" not in _metrics:
        res = evaluate.run_feed()
        _metrics["m"] = {
            "medium": evaluate.metrics(res, "medium"), "high": evaluate.metrics(res, "high"),
            "note": "Демо-лента написана вместе со словарями, поэтому эти цифры показывают только, что всё работает. "
                    "Для честной оценки нужен отдельный тест, написанный другими людьми."}
    return _metrics["m"]


def crawl_entry(name, parent, results, local=False):
    """Строка отчёта автопоиска по одному каналу и ссылки на другие каналы с весом.
    local: режим «Шымкент», вперёд идут каналы города и ссылки из шымкентских постов."""
    from .crawl import channel_refs
    levels = [r["level"] for r in results]
    risky = [r for r in results if r["level"] != "low"]
    top = {}
    for r in risky:
        for f in r["found"].values():
            if f["track"] == r["track"] and f["weight"] > 0:
                top[f["title"]] = top.get(f["title"], 0) + 1
    refs = {}
    for r in results:
        weight = {"high": 3, "medium": 2, "low": 1}[r["level"]]
        if local and r["geo"]["city"] == geo.CITY:
            weight += 2
        for ref in channel_refs(" ".join(s["text"] for s in r["segments"])):
            if ref != name:
                refs[ref] = max(refs.get(ref, 0), weight + (2 if local and geo.HANDLE.search(ref) else 0))
    entry = {"channel": name, "from": parent, "posts": len(results), "error": None,
             "high": levels.count("high"), "medium": levels.count("medium"),
             "local": sum(1 for r in results if r["geo"]["city"] == geo.CITY),
             "tracks": sorted({r["track"] for r in risky if r["track"]}),
             "signs": [k for k, _ in sorted(top.items(), key=lambda kv: -kv[1])[:3]],
             "title": results[0].get("account_name") if results else None}
    return entry, refs


def report_html(r):
    v = engine.public_view(r)
    e = html.escape
    feats = "".join(
        f"<tr><td><b>{e(f['title'])}</b>{'<br><span class=d>' + e(f['detail']) + '</span>' if f.get('detail') else ''}</td>"
        f"<td>{'<br>'.join('«' + e(q['text']) + '»' + (' <span class=d>(' + _src(q) + ')</span>') for q in f['quotes'][:2]) or '—'}</td>"
        f"<td class=d>{e(f['norm'])}</td></tr>" for f in v["features"] if f["track"] == v["track"] or f["code"] == "N1")
    cnt = "".join(f"<li>{e(c['title'])}</li>" for c in v["counters"]) or "<li>нет</li>"
    missing = "".join(f"<li>{e(m)}</li>" for m in (v["tracks"].get(v["track"] or "", {}) or {}).get("missing", [])) or "<li>все основные признаки найдены</li>"
    found = (f"<h3>Обнаруженные признаки</h3><table><tr><th>Признак</th><th>Фрагмент</th><th>Основание</th></tr>{feats}</table>"
             f"<h3>Не обнаружено</h3><ul>{missing}</ul>") if v["track"] else "<p><b>Признаков возможного нарушения не найдено.</b></p>"
    text = "<br>".join(e(s["text"]) for s in v["segments"] if s["src"] == "text")
    ocr_t = "<br>".join(e(s["text"]) for s in v["segments"] if s["src"] == "ocr")
    cid = v["id"]
    return f"""<!doctype html><html lang=ru><head><meta charset=utf-8><meta name=viewport content="width=device-width, initial-scale=1"><title>Справка {e(cid)}</title>
<style>body{{font:14px/1.5 -apple-system,Segoe UI,Arial,sans-serif;max-width:820px;margin:32px auto;padding:0 16px;color:#111;background:#fff}}
h1{{font-size:20px;margin:0 0 4px}}table{{border-collapse:collapse;width:100%;margin:8px 0}}td,th{{border:1px solid #ccc;padding:6px 8px;vertical-align:top;text-align:left;overflow-wrap:anywhere}}
@media (max-width:480px){{td,th{{padding:5px 6px;font-size:13px}}}}
.d{{color:#555;font-size:12px}}.box{{border:1px solid #ccc;padding:10px;background:#fafafa}}.warn{{border-left:4px solid #b45309;padding:8px 12px;background:#fff7ed}}
@media print{{button{{display:none}}}}</style></head><body>
<button onclick="print()">Печать / PDF</button>
<h1>Справка о признаках возможного нарушения</h1>
<div class=d>Сформирована системой «Белгі» {datetime.now().strftime('%d.%m.%Y %H:%M')} · кейс {e(cid)}</div>
{'<p class=warn><b>Синтетический пример из демо-ленты, не настоящая публикация.</b></p>' if v.get('demo') else ''}
<p class=warn>{e(engine.DISCLAIMER)}</p>
<table><tr><th>Источник</th><td>{e(PLATFORM.get(v['platform'], v['platform'] or ''))} · {e(v['account'] or '')} {('· ' + e(v['group'])) if v.get('group') else ''}</td></tr>
<tr><th>Дата публикации</th><td>{e(_dt(v['ts']))}</td></tr>
<tr><th>Ссылка</th><td>{e(v['url'] or 'демо-данные, ссылки нет')}</td></tr>
<tr><th>Привязка к городу</th><td>{e(_geo(v['geo']))}</td></tr>
<tr><th>Направление</th><td>{e(v['track_ru'] or 'признаки схем не найдены')}</td></tr>
<tr><th>Уровень риска</th><td><b>{e(v['level_ru'])}</b> ({v['score']} из 100)</td></tr></table>
<h3>Текст публикации</h3><div class=box>{text or 'нет'}</div>
{'<h3>Текст со скриншота (распознан автоматически)</h3><div class=box>' + ocr_t + '</div>' if ocr_t else ''}
{found}
<h3>Обстоятельства, снижающие риск</h3><ul>{cnt}</ul>
<p>Проверил специалист: ____________________ &nbsp; Решение: ____________________</p>
</body></html>"""


def _geo(g):
    why = "; ".join(dict.fromkeys(f"«{q['text']}» ({q['why']})" for q in g["evidence"]))
    return g["label"] + (": " + why if why else "")


KZ_TIME = timezone(timedelta(hours=5))
PLATFORM = {"instagram": "Instagram", "telegram": "Telegram", "whatsapp": "WhatsApp", "tiktok": "TikTok", "manual": "Ручная проверка"}


def _dt(ts):
    try:
        d = datetime.fromisoformat(ts)
        return (d.astimezone(KZ_TIME) if d.tzinfo else d).strftime("%d.%m.%Y %H:%M")
    except (TypeError, ValueError):
        return ts or ""


def _src(q):
    if q["src"] == "asr" and q.get("t") is not None:
        return f"эфир {int(q['t']) // 60}:{int(q['t']) % 60:02d}"
    return {"text": "текст", "ocr": "скриншот", "bio": "профиль", "asr": "эфир", "llm": "LLM"}.get(q["src"], q["src"])
