"""Сущности: суммы, обещанная доходность, реквизиты, ссылки, промокоды.
Карты и телефоны хранятся только маской и хешем."""
import hashlib
import re
from urllib.parse import urlsplit, parse_qsl

from . import lexicon as lx

NUM = r"\d[\d\s.,]*\d|\d"
MULT = r"(?:\s*(?:к|k|мың|тыс\w*|млн))?"
CUR = r"\s*(?:тг|тенге|₸|tg|tr|тr|tг|kzt|\$|usd|долл\w*)?"  # tr: так OCR часто читает «тг»

# ДЕПОЗИТ: ориентир для сравнения обещанной доходности
DEPOSIT_MONTHLY = 1.7     # % в месяц: около 20% годовых по тенговым вкладам
BASE_RATE = 16.25         # базовая ставка Нацбанка с 23.10.2026 (было 16,75)


def h(value):
    return hashlib.sha1(value.encode()).hexdigest()[:10]


def parse_amount(s):
    s = s.strip().lower()
    m = re.match(r"(" + NUM + r")\s*(к|k|мың|тыс\w*|млн)?", s)
    if not m:
        return None
    num = m.group(1).replace(" ", "").replace(" ", "")
    if num.count(",") == 1 and len(num.split(",")[1]) <= 2:
        num = num.replace(",", ".")
    num = num.replace(",", "")
    if num.count(".") > 1 or (num.count(".") == 1 and len(num.split(".")[1]) == 3):
        num = num.replace(".", "")
    try:
        v = float(num)
    except ValueError:
        return None
    unit = m.group(2) or ""
    if unit in ("к", "k", "мың") or unit.startswith("тыс"):
        v *= 1000
    elif unit == "млн":
        v *= 1_000_000
    return v


def money_near(text, start, end, window=25):
    """Первая сумма в окне вокруг совпадения (нормализованный текст)."""
    seg = text[max(0, start - window):end + window]
    for m in re.finditer(r"(" + NUM + r")" + MULT + r"\s*(?:тг|тенге|теңге|₸|tg|tr|kzt)", seg):
        v = parse_amount(m.group(0))
        if v and v >= 50:
            return v
    return None


PERIOD_DAYS = {"час": 1 / 24, "сагат": 1 / 24, "сут": 1, "дн": 1, "день": 1, "дня": 1, "кун": 1,
               "недел": 7, "апта": 7, "мес": 30, "ай": 30, "год": 365, "жыл": 365}


def period_days(word, n=1):
    w = word.lower()
    for k, d in PERIOD_DAYS.items():
        if w.startswith(k):
            return d * (n or 1)
    return None


def find_returns(text):
    """Обещанная доходность. Возвращает список (start, end, monthly_%, описание)."""
    out = []
    # «вложи 5000 получи 10 000 через 10 дней»
    for m in re.finditer(
            r"(?:влож\w*|вкла(?:дывай|дыва\w*)|инвестир\w*|закин\w*|кинь|кидай|vlozh\w*)\s*(?:от\s+)?(" + NUM + r")" + MULT + CUR +
            r"[^\d\n]{0,12}?(?:получи\w*|забер\w*|вывед\w*|верн\w*|poluch\w*)\s*(?:от\s+)?(" + NUM + r")" + MULT + CUR, text):
        x = _amount_with_unit(m, 1)
        y = _amount_with_unit(m, 2)
        if not x or not y or y <= x:
            continue
        days = _duration_after(text, m.end())
        out.append(_mk(m.start(), m.end() if not days else days[1], (y / x - 1) * 100, days[0] if days else None,
                       f"вложение {int(x):,} → {int(y):,}".replace(",", " ")))
    # казахский порядок: «10 000 тг салсаң, 10 күнде 20 000 тг аласың»
    for m in re.finditer(r"(" + NUM + r")" + MULT + CUR + r"\s*сал\w*.{0,40}?(" + NUM + r")" + MULT + CUR + r"\s*ал\w*", text, re.S):
        x, y = _amount_with_unit(m, 1), _amount_with_unit(m, 2)
        if not x or not y or y <= x:
            continue
        dm = re.search(r"(\d+)\s*(күн|кун|апта|ай|сағат|сагат)", m.group(0))
        days = period_days(dm.group(2), int(dm.group(1))) if dm else None
        if not days:
            d2 = _duration_after(text, m.end())
            days = d2[0] if d2 else None
        out.append(_mk(m.start(), m.end(), (y / x - 1) * 100, days, f"салым {int(x):,} → {int(y):,}".replace(",", " ")))
    # «30% в неделю», «3% в день», «от 40% в месяц»
    for m in re.finditer(r"(\d+(?:[.,]\d+)?)\s*%\s*(?:в|за|per|/)?\s*(день|сутки|недел\w*|месяц|мес\b|год)", text):
        p = float(m.group(1).replace(",", "."))
        days = period_days(m.group(2))
        out.append(_mk(m.start(), m.end(), p, days, f"{m.group(1)}% {m.group(2)}"))
    # «30% за 3 дня»
    for m in re.finditer(r"(\d+(?:[.,]\d+)?)\s*%\s*за\s*(\d+)\s*(час\w*|дн\w*|день|сут\w*|недел\w*|мес\w*)", text):
        p = float(m.group(1).replace(",", "."))
        days = period_days(m.group(3), int(m.group(2)))
        out.append(_mk(m.start(), m.end(), p, days, f"{m.group(1)}% за {m.group(2)} {m.group(3)}"))
    # казахский: «күніне 5%», «айына 30%»
    for m in re.finditer(r"(кунине|аптасына|айына|кун\s+сайын|апта\s+сайын|ай\s+сайын)\s*(\d+(?:[.,]\d+)?)\s*%", text):
        p = float(m.group(2).replace(",", "."))
        days = 30 if m.group(1).startswith("ай") else 7 if m.group(1).startswith("апта") else 1
        out.append(_mk(m.start(), m.end(), p, days, f"{m.group(2)}% {m.group(1)}"))
    # «x2 за 10 дней», «удвоим за неделю»
    for m in re.finditer(r"(?:\b[xх]\s?(\d+)|в\s+(\d+)\s+раза|удво\w*|еки\s+есе)\s*(?:за|через)?\s*(\d+)?\s*(час\w*|дн\w*|день|недел\w*|мес\w*|кун\w*)?", text):
        k = int(m.group(1) or m.group(2) or 2)
        if k < 2 or k > 100:
            continue
        if not (m.group(3) or m.group(4)) and not re.search(r"удво|еки\s+есе", m.group(0)):
            continue
        days = period_days(m.group(4), int(m.group(3) or 1)) if m.group(4) else None
        out.append(_mk(m.start(), m.end(), (k - 1) * 100, days, f"рост в {k} раза"))
    return _dedupe(out)


def _amount_with_unit(m, g):
    s = m.group(g)
    tail = m.string[m.end(g):m.end(g) + 6]
    u = re.match(r"\s*(к|k|мың|тыс\w*|млн)\b", tail)
    return parse_amount(s + (u.group(0) if u else ""))


def _duration_after(text, pos):
    m = re.match(r".{0,15}?(?:через|за|в течение|спустя)\s*(\d+)?\s*(час\w*|сут\w*|дн\w*|день|недел\w*|мес\w*)",
                 text[pos:pos + 45], re.S)
    if not m:
        m = re.match(r".{0,15}?(\d+)\s*(күн\w*|кун\w*|апта\w*|сағат\w*)", text[pos:pos + 45], re.S)
    if m:
        return period_days(m.group(2), int(m.group(1) or 1)), pos + m.end()
    return None


def _mk(s, e, pct, days, label):
    monthly = pct * 30 / days if days else None
    return {"start": s, "end": e, "pct": pct, "days": days, "monthly": monthly, "label": label}


def _dedupe(items):
    items.sort(key=lambda r: (r["start"], -(r["end"] - r["start"])))
    out = []
    for r in items:
        if out and r["start"] < out[-1]["end"]:
            continue
        out.append(r)
    return out


CARD = re.compile(r"(?<!\d)(\d{4})[\s-]?(\d{4}|\d{2}\*\*|\*{4})[\s-]?(\d{4}|\*{4})[\s-]?(\d{4})(?!\d)")
PHONE = re.compile(r"(?<![\d+])(?:\+?7|8)[\s\-(]*(7\d{2})[\s\-)]*(\d{3})[\s\-]*(\d{2})[\s\-]*(\d{2})(?!\d)")
IBAN = re.compile(r"\bKZ\d{2}[A-Z0-9]{16}\b")
URL = re.compile(r"(?:https?://)?(?:[a-z0-9][a-z0-9\-]*\.)+[a-z]{2,12}(?:/[^\s)\]\"'<>«»]*)?", re.I)
PROMO = re.compile(r"(?i:промокод\w*|промик\w*|promokod\w*|promo\s?code|promo|код)\s*[:\-–—]?\s*([A-Z][A-Z0-9_]{2,15}|[0-9]+[A-Z][A-Z0-9_]+)")
MENTION = re.compile(r"(?<![\w.])@([A-Za-z0-9_.]{3,32})")


def extract(text):
    """Сущности из исходного текста одного фрагмента."""
    ents = []
    for m in CARD.finditer(text):
        digits = "".join(m.groups())
        ents.append({"type": "card", "start": m.start(), "end": m.end(), "id": "card:" + h(digits),
                     "label": f"карта {m.group(1)} •••• •••• {m.group(4)}"})
    for m in PHONE.finditer(text):
        num = "+7" + "".join(m.groups())
        ents.append({"type": "phone", "start": m.start(), "end": m.end(), "id": "phone:" + h(num),
                     "label": f"телефон +7 {m.group(1)} ••• •• {m.group(4)}"})
    for m in IBAN.finditer(text):
        ents.append({"type": "iban", "start": m.start(), "end": m.end(), "id": "iban:" + h(m.group()),
                     "label": f"счёт {m.group()[:6]}…{m.group()[-4:]}"})
    for m in URL.finditer(text):
        raw = m.group().rstrip(".,!?;:")
        info = analyze_url(raw)
        if not info:
            continue
        whole = info["domain"] in lx.SHORTENERS | lx.LINK_IN_BIO | {"t.me", "telegram.me", "chat.whatsapp.com"}
        lid = "url:" + raw.split("://")[-1].lower() if whole else "domain:" + info["domain"]
        ents.append({"type": "link", "start": m.start(), "end": m.start() + len(raw), "id": lid,
                     "label": info["domain"], "url": raw, "signals": info["signals"], "licensed": info["licensed"]})
    for m in PROMO.finditer(text):
        code = m.group(1).upper()
        if code in {"KASPI", "IBAN"}:
            continue
        ents.append({"type": "promo", "start": m.start(1), "end": m.end(1), "id": "promo:" + code,
                     "label": f"промокод {code}"})
    for m in MENTION.finditer(text):
        ents.append({"type": "mention", "start": m.start(), "end": m.end(), "id": "acc:@" + m.group(1).lower(),
                     "label": "@" + m.group(1)})
    return ents


def analyze_url(raw):
    url = raw if re.match(r"https?://", raw, re.I) else "https://" + raw
    try:
        parts = urlsplit(url)
    except ValueError:
        return None
    domain = (parts.hostname or "").lower()
    if not domain or "." not in domain or domain.replace(".", "").isdigit():
        return None
    tld = domain.rsplit(".", 1)[-1]
    if not re.search(r"[a-z]", domain.rsplit(".", 1)[0]) or len(tld) < 2:
        return None
    if domain.startswith("www."):
        domain = domain[4:]
    signals = []
    path = parts.path or ""
    if domain in lx.SHORTENERS:
        signals.append(f"сокращённая ссылка {domain}: конечный адрес скрыт")
    if domain in lx.LINK_IN_BIO:
        signals.append(f"страница-прокладка {domain} (мультиссылка)")
    if domain in ("t.me", "telegram.me") and (path.startswith("/+") or path.startswith("/joinchat")):
        signals.append("закрытый Telegram-канал по приглашению")
    if domain in ("chat.whatsapp.com",):
        signals.append("приглашение в группу WhatsApp")
    params = {k.lower(): v for k, v in parse_qsl(parts.query)}
    aff = [f"{k}={v}" for k, v in params.items() if k in lx.AFF_PARAMS]
    if domain in ("t.me",) and "start" in params:
        aff.append(f"start={params['start']}")
    if aff:
        signals.append("партнёрские метки " + ", ".join(aff))
    if tld in lx.CHEAP_TLD:
        signals.append(f"дешёвая доменная зона .{tld}")
    if re.search(lx.CASINO_DOMAIN, domain):
        signals.append(f"в домене {domain} название казино или «зеркало»")
    licensed = domain in lx.LICENSED_KZ
    return {"domain": domain, "signals": signals, "licensed": licensed}
