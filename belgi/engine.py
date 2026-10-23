"""Анализ публикации: признаки -> баллы по трекам -> уровень риска с объяснением."""
import re
from collections import defaultdict

from . import entities as en
from . import lexicon as lx
from .normalize import detect_lang, fold, normalize

HIGH, MEDIUM = 70, 35
LEVELS = ["low", "medium", "high"]
LEVEL_RU = {"low": "низкий", "medium": "средний", "high": "высокий"}
DISCLAIMER = ("Система показывает признаки возможного нарушения. Законность схемы "
              "проверяет специалист с учётом законодательства РК.")


def fmt(x, digits=0):
    s = f"{x:,.{digits}f}".replace(",", " ").replace(".", ",")
    return s


def _compile(pats):
    return [re.compile(fold(p), re.S) for p in pats]


FEAT = {code: (t, title, w, norm, _compile(p)) for code, (t, title, w, norm, p) in lx.FEATURES.items()}
CNTR = {code: (t, title, w, norm, _compile(p)) for code, (t, title, w, norm, p) in lx.COUNTERS.items()}
CTX = {t: _compile(p) for t, p in lx.CONTEXT.items()}
NEWS = _compile(lx.NEWS)
PAY = re.compile(fold(lx.PAY_VERBS))
KASPI = re.compile(lx.KASPI)
INVEST = re.compile(r"влож|инвест|салым|вклад|сал(?:сан|ыныз)|vlozh|взнос|пакет|акшаныз")
COUNT = re.compile(r"(\d[\d\s]{0,6}\d|\d+)\s*(?:номер\w*|номир\w*|билет\w*|nomer\w*)")


def _segments(post):
    segs = [{"src": "text", "text": post.get("text") or ""}]
    if post.get("bio"):
        segs.append({"src": "bio", "text": post["bio"]})
    if post.get("ocr_text"):
        segs.append({"src": "ocr", "text": post["ocr_text"], "image": post.get("image")})
    for part in post.get("transcript") or []:
        segs.append({"src": "asr", "text": part["text"], "t": part.get("t", 0)})
    return segs


def _quote(seg, s, e):
    text = seg["text"]
    while s > 0 and text[s - 1].isalnum():
        s -= 1
    while e < len(text) and text[e].isalnum():
        e += 1
    return {"text": text[s:e].strip(), "src": seg["src"], "t": seg.get("t"), "seg": seg["i"], "start": s, "end": e}


def analyze(post):
    segs = _segments(post)
    hits = defaultdict(list)       # code -> [quote]
    counters = defaultdict(list)
    ctx = {t: False for t in lx.TRACKS}
    news = False
    returns, ents, pay_q, req_q, counts, invest = [], [], [], [], [], False

    for i, seg in enumerate(segs):
        seg["i"] = i
        n = normalize(seg["text"])
        for t, pats in CTX.items():
            if any(p.search(n.text) for p in pats):
                ctx[t] = True
        if seg["src"] in ("text", "asr") and any(p.search(n.text) for p in NEWS):
            news = True
        if INVEST.search(n.text):
            invest = True
        for code, (_, _, _, _, pats) in FEAT.items():
            for p in pats:
                for m in p.finditer(n.text):
                    hits[code].append(_quote(seg, *n.orig_span(m.start(), m.end())))
        for code, (_, _, _, _, pats) in CNTR.items():
            for p in pats:
                for m in p.finditer(n.text):
                    counters[code].append(_quote(seg, *n.orig_span(m.start(), m.end())))
        for r in en.find_returns(n.text):
            r["quote"] = _quote(seg, *n.orig_span(r["start"], r["end"]))
            returns.append(r)
        for m in PAY.finditer(n.text):
            pay_q.append(_quote(seg, *n.orig_span(m.start(), m.end())))
        for m in KASPI.finditer(n.text):
            req_q.append(_quote(seg, *n.orig_span(m.start(), m.end())))
        for m in COUNT.finditer(n.text):
            v = int(re.sub(r"\D", "", m.group(1)))
            pre = n.text[max(0, m.start() - 12):m.start()]
            if v > 1 and not re.search(r"остал|калды|қалды", pre + m.group(0)):
                counts.append(v)
        for e in en.extract(seg["text"]):
            e["seg"] = i
            ents.append(e)
            if e["type"] in ("card", "phone", "iban"):
                req_q.append(_quote(seg, e["start"], e["end"]))
    # цена номера для расчёта сбора (по исходному тексту рядом с цитатой)
    for q in hits.get("L1", []):
        q["price"] = en.money_near(segs[q["seg"]]["text"].lower(), q["start"], q["end"])

    found = {}
    computed = []

    def add(code, track, title, weight, norm, quotes, detail=None):
        found[code] = {"code": code, "track": track, "title": title, "weight": weight,
                       "norm": lx.NORMS.get(norm, norm), "quotes": quotes[:3], "detail": detail}

    for code, quotes in hits.items():
        t, title, w, norm, _ = FEAT[code]
        add(code, t, title, w, norm, quotes)

    has_req = bool(req_q)
    # L2 / P4: просьба перевести деньги на личные реквизиты
    if has_req and ctx["lottery"]:
        if pay_q:
            add("L2", "lottery", "Перевод на личный счёт или Kaspi", 30, "lottery_committee", req_q[:1] + pay_q[:1])
        else:
            add("L2", "lottery", "Реквизиты физлица для оплаты", 20, "lottery_committee", req_q[:1])
    if has_req and ctx["pyramid"] and (invest or returns):
        if pay_q:
            add("P4", "pyramid", "Вложения переводом на личную карту", 30, "afm_3115", req_q[:1] + pay_q[:1])
        else:
            add("P4", "pyramid", "Реквизиты физлица для вложений", 20, "afm_3115", req_q[:1])

    # L5: сколько может собрать организатор
    price = next((q.get("price") for q in hits.get("L1", []) if q.get("price")), None)
    if price and counts:
        total = price * max(counts)
        add("L5", "lottery", "Доход организатора", 15, "lottery_committee", hits["L1"][:1],
            detail=f"{max(counts)} номеров × {fmt(price)} ₸ = до {fmt(total)} ₸")
        computed.append({"label": "Сбор организатора", "value": f"до {fmt(total)} ₸"})

    # P1: обещанная доходность против вкладов
    best = None
    for r in returns:
        key = r["monthly"] if r["monthly"] is not None else r["pct"] * 0.5
        if best is None or key > (best["monthly"] if best["monthly"] is not None else best["pct"] * 0.5):
            best = r
    if best:
        m = best["monthly"]
        if m is not None and m > 3:
            times = m / en.DEPOSIT_MONTHLY
            detail = (f"обещано около {fmt(m)}% в месяц; вклады в банках РК около {fmt(en.DEPOSIT_MONTHLY, 1)}% в месяц "
                      f"(около 20% годовых, базовая ставка Нацбанка {fmt(en.BASE_RATE, 2)}%), это в {fmt(times)} раз выше")
            add("P1", "pyramid", "Доходность выше рынка", 50 if m > 10 else 25, "afm_311", [best["quote"]], detail)
            computed.append({"label": "Обещанная доходность", "value": f"≈ {fmt(m)}% в месяц"})
        elif m is None and best["pct"] >= 30:
            add("P1", "pyramid", "Доходность выше рынка", 35, "afm_311", [best["quote"]],
                f"обещан рост вложений на {best['pct']:.0f}%, срок не указан")
            computed.append({"label": "Обещанный рост", "value": f"+{best['pct']:.0f}%"})

    # C4: подозрительные ссылки
    sus = [e for e in ents if e["type"] == "link" and e.get("signals")]
    if sus:
        seg_q = [{"text": e["url"], "src": segs[e["seg"]]["src"], "t": segs[e["seg"]].get("t"), "seg": e["seg"],
                  "start": e["start"], "end": e["end"]} for e in sus]
        add("C4", "casino", "Подозрительная ссылка", 25, "casino_ban", seg_q,
            "; ".join(dict.fromkeys(s for e in sus for s in e["signals"])))

    # контрпризнаки с условиями
    cnt = {}
    pay_part = "L1" in found or "L3" in found
    for code, quotes in counters.items():
        t, title, w, norm, _ = CNTR[code]
        if code in ("X_FREE", "X_SOCIAL") and pay_part:
            continue
        if code == "X_PROMO" and "L2" in found and found["L2"]["weight"] >= 30:
            continue
        if code == "X_BOOKMAKER" and ("C1" in found or "C2" in found):
            continue
        if code == "X_BANK" and (("P1" in found and found["P1"]["weight"] >= 50) or "P4" in found):
            continue
        cnt[code] = {"code": code, "track": t, "title": title, "weight": w,
                     "norm": lx.NORMS.get(norm, norm), "quotes": quotes[:2]}
    for e in ents:
        if e["type"] == "link" and e.get("licensed") and "C1" not in found and "C2" not in found:
            cnt["X_BOOKMAKER"] = {"code": "X_BOOKMAKER", "track": "casino", "title": lx.COUNTERS["X_BOOKMAKER"][1],
                                  "weight": -40, "norm": lx.NORMS["casino_ban"], "quotes": []}
    cta = "C3" in found or "C4" in found or "C7" in found or "L2" in found or "P4" in found
    if news and not cta:
        cnt["X_NEWS"] = {"code": "X_NEWS", "track": None, "title": "Новость или предупреждение, нет призыва и реквизитов",
                         "weight": -60, "norm": "Текст сообщает о схеме или предупреждает о ней, а не продвигает её", "quotes": []}

    result = {
        "id": post["id"], "platform": post.get("platform"), "kind": post.get("kind"),
        "account": post.get("account"), "account_name": post.get("account_name"), "group": post.get("group"),
        "followers": post.get("followers"), "ts": post.get("ts"), "url": post.get("url"),
        "image": post.get("image"), "lang": detect_lang(" ".join(s["text"] for s in segs)),
        "segments": [{k: v for k, v in s.items() if k != "i"} for s in segs],
        "ctx": ctx, "found": found, "counters": cnt, "computed": computed,
        "entities": _unique_entities(ents), "label": post.get("label"), "network": [],
    }
    score_tracks(result)
    return result


def _unique_entities(ents):
    seen, out = set(), []
    for e in ents:
        if e["id"] in seen:
            continue
        seen.add(e["id"])
        out.append({k: e.get(k) for k in ("type", "id", "label", "url", "signals", "licensed")})
    return out


def score_tracks(r):
    found, cnt, ctx = r["found"], r["counters"], r["ctx"]
    tracks = {}
    for t in lx.TRACKS:
        codes = [c for c, f in found.items() if f["track"] == t]
        if not ctx[t] and not any(found[c]["weight"] >= 30 for c in codes):
            tracks[t] = {"score": 0, "level": "low", "codes": [], "missing": []}
            continue
        score = sum(found[c]["weight"] for c in codes)
        if t == "casino" and len([q for q in found.get("C2", {}).get("quotes", [])]) >= 2:
            score += 10
        score += sum(c["weight"] for c in cnt.values() if c["track"] in (t, None))
        score = max(0, min(100, score))
        level = "high" if score >= HIGH else "medium" if score >= MEDIUM else "low"
        level = _cap(t, level, found)
        if "X_NEWS" in cnt:
            level = "low"
        missing = [label for keys, label in lx.COMPOSITION[t] if not any(k in found for k in keys.split("|"))]
        tracks[t] = {"score": score, "level": level, "codes": codes, "missing": missing}
    r["tracks"] = tracks
    primary = max(tracks, key=lambda t: (LEVELS.index(tracks[t]["level"]), tracks[t]["score"]))
    r["track"] = primary if tracks[primary]["score"] > 0 else None
    r["level"] = tracks[primary]["level"] if r["track"] else "low"
    r["score"] = tracks[primary]["score"] if r["track"] else 0
    feats = [f for f in found.values() if f["track"] == r["track"]] if r["track"] else []
    feats.sort(key=lambda f: -f["weight"])
    r["summary"] = ", ".join(f["title"].lower() for f in feats[:3]) if feats else "признаки схем не найдены"
    cand = [t for t in tracks if ctx[t] and any(f["track"] == t for f in found.values())]
    r["track_hint"] = r["track"] or (max(cand, key=lambda t: sum(f["weight"] for f in found.values() if f["track"] == t)) if cand else None)
    return r


def _cap(t, level, f):
    def cap(lv, mx):
        return LEVELS[min(LEVELS.index(lv), LEVELS.index(mx))]
    if t == "lottery":
        paid = "L1" in f or "L3" in f
        if not paid and "L2" not in f:
            return cap(level, "low")
        if not paid:
            return cap(level, "medium")
        if not ("L2" in f or "L4" in f or "L5" in f):
            return cap(level, "medium")
    if t == "casino":
        if "C1" not in f and "C2" not in f:
            return cap(level, "low")
        if not ("C3" in f or "C4" in f or "C7" in f):
            return cap(level, "medium")
    if t == "pyramid":
        core = any(k in f for k in ("P1", "P2", "P3", "P5"))
        if not core:
            return cap(level, "low")
        if not any(k in f for k in ("P4", "P3", "P5")) and not ("P1" in f and f["P1"]["weight"] >= 50):
            return cap(level, "medium")
    return level


NET_TYPES = {"card": "та же карта", "phone": "тот же телефон", "iban": "тот же счёт",
             "promo": "тот же промокод", "link": "та же ссылка или домен", "mention": "тот же контакт"}


def apply_network(results):
    """Связи между публикациями разных аккаунтов через общие реквизиты, промокоды, домены."""
    by_ent = defaultdict(list)
    for r in results:
        r["network"] = []
        for code in ("N1", "L6"):
            r["found"].pop(code, None)
        for e in r["entities"]:
            if e["type"] == "link" and not e.get("signals"):
                continue
            by_ent[e["id"]].append(r)
    for eid, rs in by_ent.items():
        accounts = {x["account"] for x in rs}
        if len(accounts) < 2:
            continue
        for r in rs:
            e = next(e for e in r["entities"] if e["id"] == eid)
            others = sorted(accounts - {r["account"]})
            r["network"].append({"entity": e["label"], "type": e["type"], "id": eid, "accounts": others,
                                 "posts": [x["id"] for x in rs if x is not r]})
    # повторяемость розыгрышей у одного аккаунта
    by_acc = defaultdict(list)
    for r in results:
        if "L1" in r["found"] or "L3" in r["found"]:
            by_acc[r["account"]].append(r)
    for r in results:
        if r["network"] and r["track"]:
            n = r["network"]
            desc = "; ".join(f"{x['entity']} также у {', '.join(x['accounts'])}" for x in n)
            r["found"]["N1"] = {"code": "N1", "track": r["track"], "title": "Связь с другими аккаунтами",
                                "weight": 15, "norm": lx.NORMS["network"], "quotes": [], "detail": desc}
        if len(by_acc.get(r["account"], [])) >= 2:
            r["found"]["L6"] = {"code": "L6", "track": "lottery", "title": "Серия розыгрышей у аккаунта", "weight": 15,
                                "norm": lx.NORMS["network"], "quotes": [],
                                "detail": f"{len(by_acc[r['account']])} платных розыгрыша в проверенных публикациях"}
        score_tracks(r)
    return results


def public_view(r, full=True):
    """То, что уходит в интерфейс."""
    feats = sorted(r["found"].values(), key=lambda f: (f["track"] != r["track"], -f["weight"]))
    out = {k: r[k] for k in ("id", "platform", "kind", "account", "account_name", "group", "followers", "ts", "url",
                             "lang", "level", "track", "score", "summary", "image")}
    out["level_ru"] = LEVEL_RU[r["level"]]
    out["track_ru"] = lx.TRACKS.get(r["track"], "")
    out["track_hint"] = r.get("track_hint")
    out["tracks"] = {t: {"score": v["score"], "level": v["level"], "missing": v["missing"]} for t, v in r["tracks"].items()}
    out["chips"] = [f["title"] for f in feats if f["track"] == r["track"]][:3]
    out["snippet"] = (r["segments"][0]["text"] or (r["segments"][-1]["text"] if r["segments"] else ""))[:220]
    out["has_image"] = any(s["src"] == "ocr" for s in r["segments"])
    out["has_audio"] = any(s["src"] == "asr" for s in r["segments"])
    out["network_n"] = len(r["network"])
    out["feedback"] = r.get("feedback")
    out["llm"] = r.get("llm")
    if full:
        out["features"] = feats
        out["counters"] = sorted(r["counters"].values(), key=lambda c: c["weight"])
        out["segments"] = r["segments"]
        out["entities"] = r["entities"]
        out["computed"] = r["computed"]
        out["network"] = r["network"]
        out["highlights"] = _highlights(r)
        out["disclaimer"] = DISCLAIMER
    return out


def _highlights(r):
    hl = defaultdict(list)
    for f in r["found"].values():
        for q in f["quotes"]:
            hl[q["seg"]].append({"start": q["start"], "end": q["end"], "code": f["code"], "track": f["track"], "kind": "feature"})
    for c in r["counters"].values():
        for q in c["quotes"]:
            hl[q["seg"]].append({"start": q["start"], "end": q["end"], "code": c["code"], "track": c["track"], "kind": "counter"})
    # все совпадения признака, а не только первые три
    return {k: sorted(v, key=lambda x: x["start"]) for k, v in hl.items()}
