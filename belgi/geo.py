"""Привязка публикации к городу. Режим «Шымкент» показывает только схемы, нацеленные
на жителей Шымкента. Это фильтр охвата, а не признак нарушения: на балл риска не влияет."""
import re

from .normalize import fold, normalize

CITY = "shymkent"
CITY_RU = "Шымкент"
MIN_SCORE = 2

# публичные каналы города: с них начинается автономный обход
SEEDS = ["shymkentonline", "otyrarkz", "shymkentgov", "rabota_shymkent_vakansii", "shymkent_now"]
LOCAL_CHANNELS = set(SEEDS) | {"shymkent_satu"}
HANDLE = re.compile(r"shym|chimkent|шымкент|чимкент", re.I)

# (вес, что нашли, шаблоны); шаблоны в том же виде, что нормализованный текст
SHYM = [
    (3, "название города", [r"\bшымкент\w*", r"\bчимкент\w*", r"\bshymkent\w*", r"\bchimkent\w*",
                            r"\bшым\s?сити\b", r"\bshym\s?city\b"]),
    (3, "городской телефон 7252", [r"(?<!\d)(?:\+?7|8)[\s\-(]*7252[\s\-)]*\d", r"\(7252\)"]),
    (2, "район Шымкента", [r"\bабайск\w*\s+район\w*", r"\bабай\s+аудан\w*",
                           r"\bаль-?фараби\w*\s+район\w*", r"\bал-?фараби\s+аудан\w*",
                           r"\bенбекшинск\w*\s+район\w*", r"\bенбекши\s+аудан\w*",
                           r"\bкаратауск\w*\s+район\w*", r"\bкаратау\s+аудан\w*",
                           r"\bтуранск\w*\s+район\w*", r"\bтуран\s+аудан\w*"]),
    (2, "микрорайон или место в Шымкенте", [r"\bнурсат\w*", r"\bкайтпас\w*", r"\bтассай\w*", r"\bкатын-?копр\w*",
                                             r"\bтамерлановск\w*", r"\bмега\s?планет\w*", r"\bmega\s?planet\b"]),
    (1, "улица или место, частое в Шымкенте", [r"\bтауке\s+хан\w*", r"\bбайдибек\w*", r"\bордабасы\b", r"\bюко\b",
                                                r"\bюжно-казахстанск\w*", r"\bонтустик\s+казакстан\w*"]),
]

OTHER = {
    "Алматы": [r"\bалматы\w*", r"\bалма-?ат\w*", r"\balmaty\b", r"(?<!\d)(?:\+?7|8)[\s\-(]*727[\s\-)]*\d"],
    "Астана": [r"\bастан[аеуыой]\w*", r"\bнур-?султан\w*", r"\bastana\b", r"(?<!\d)(?:\+?7|8)[\s\-(]*7172[\s\-)]*\d"],
    "Караганда": [r"\bкараганд\w*", r"(?<!\d)(?:\+?7|8)[\s\-(]*7212[\s\-)]*\d"],
    "Актобе": [r"\bактобе\w*", r"\baktobe\b"],
    "Тараз": [r"\bтараз\w*", r"\btaraz\b", r"(?<!\d)(?:\+?7|8)[\s\-(]*7262[\s\-)]*\d"],
    "Кызылорда": [r"\bкызылорд\w*"],
    "Туркестан": [r"\bтуркестан(?!ск)\w*", r"\bтуркистан(?!\s+облыс)\w*", r"\bturkistan\b"],
    "Атырау": [r"\bатырау\w*"],
    "Актау": [r"\bактау\w*"],
    "Павлодар": [r"\bпавлодар\w*"],
    "Усть-Каменогорск": [r"\bусть-?каменогорск\w*", r"\bоскемен\w*"],
    "Семей": [r"\bв\s+семее\b", r"\bг\.\s*семей\b", r"\bсемей\s+калас\w*", r"\bсемипалатинск\w*"],
    "Костанай": [r"\bкостана[йи]\w*"],
    "Уральск": [r"\bуральск\w*"],
    "Петропавловск": [r"\bпетропавл\w*"],
    "Талдыкорган": [r"\bталдыкорган\w*"],
    "Кокшетау": [r"\bкокшетау\w*"],
}
NATIONWIDE = [r"\bпо\s+всему\s+(?:казахстану|кз|рк)\b", r"\bпо\s+казахстану\b", r"\bдоставка\s+по\s+рк\b",
              r"\bбукил\s+казакстан\w*", r"\bказакстан\s+бойынша\b", r"\bвся\s+рк\b"]


def _compile(pats):
    return [re.compile(fold(p)) for p in pats]


SHYM_RE = [(w, why, _compile(p)) for w, why, p in SHYM]
OTHER_RE = {city: _compile(p) for city, p in OTHER.items()}
NATION_RE = _compile(NATIONWIDE)


def _quote(seg, i, n, m, why):
    s, e = n.orig_span(m.start(), m.end())
    return {"why": why, "text": seg["text"][s:e].strip(), "src": seg["src"], "t": seg.get("t"), "seg": i,
            "start": s, "end": e}


def locate(post, segs):
    """segs: сегменты публикации из engine._segments (текст, профиль, скриншот, эфир)."""
    score, evidence, seen = 0, [], set()
    other = {}
    nationwide = False
    for i, seg in enumerate(segs):
        n = normalize(seg["text"])
        for w, why, pats in SHYM_RE:
            for p in pats:
                for m in p.finditer(n.text):
                    q = _quote(seg, i, n, m, why)
                    evidence.append(q)
                    if why not in seen:     # каждый вид признака считаем один раз
                        seen.add(why)
                        score += w
        for city, pats in OTHER_RE.items():
            if any(p.search(n.text) for p in pats):
                other[city] = other.get(city, 0) + 3
        if any(p.search(n.text) for p in NATION_RE):
            nationwide = True

    acc = (post.get("account") or "").lstrip("@").lower()
    if acc in LOCAL_CHANNELS:
        evidence.append({"why": "канал города", "text": "@" + acc, "src": "account"})
        score += 3
    elif HANDLE.search(acc) or HANDLE.search(post.get("account_name") or "") or HANDLE.search(post.get("group") or ""):
        name = post.get("group") if HANDLE.search(post.get("group") or "") else post.get("account")
        evidence.append({"why": "город в имени аккаунта", "text": name, "src": "account"})
        score += 2

    top_other = max(other.items(), key=lambda kv: kv[1]) if other else (None, 0)
    if score >= MIN_SCORE and score >= top_other[1]:
        city, label = CITY, CITY_RU
    elif top_other[1] >= MIN_SCORE:
        city, label = "other", top_other[0]
    elif nationwide:
        city, label = "kz", "весь Казахстан"
    else:
        city, label = None, "город не указан"
    return {"city": city, "label": label, "score": score, "evidence": evidence[:6],
            "others": sorted(other), "via": None}


def propagate(results):
    """Аккаунт без города, связанный общей картой, телефоном или промокодом со шымкентской
    публикацией, тоже попадает в режим «Шымкент»: это одна схема."""
    by_id = {r["id"]: r for r in results}
    for r in results:
        r["geo"] = dict(r["geo_base"])
    for r in results:
        if r["geo"]["city"] not in (None, "kz"):
            continue
        for link in r["network"]:
            local = [by_id[p] for p in link["posts"] if p in by_id and by_id[p]["geo_base"]["city"] == CITY]
            if local:
                g = r["geo"]
                g.update(city=CITY, label=CITY_RU, via="network")
                g["evidence"] = g["evidence"] + [{"why": "связь со шымкентской схемой", "src": "network",
                                                  "text": f"{link['entity']} также у {local[0]['account']}"}]
                break
    return results
