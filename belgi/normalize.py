"""Нормализация текста с картой позиций: поиск идёт по чистому тексту,
а цитаты и подсветка берутся из исходного."""
import re
import unicodedata
from dataclasses import dataclass

ZERO_WIDTH = set("​‌‍‎‏⁠﻿­")

# латинские буквы, похожие на кириллицу (только внутри слов с кириллицей)
LAT_TO_CYR = {"a": "а", "e": "е", "o": "о", "p": "р", "c": "с", "x": "х", "y": "у",
              "k": "к", "m": "м", "t": "т", "h": "н", "b": "в", "i": "і"}
# цифры и знаки вместо букв (только внутри слов)
LEET = {"0": "о", "3": "з", "@": "а", "4": "ч", "6": "б"}
# казахские буквы сводим к базовым: словари пишем один раз
KZ_FOLD = str.maketrans({"ә": "а", "ғ": "г", "қ": "к", "ң": "н", "ө": "о", "ұ": "у",
                         "ү": "у", "һ": "х", "і": "и", "ё": "е"})

KZ_LETTERS = set("әғқңөұүһі")
CYR = re.compile(r"[а-яёәғқңөұүһі]")

SPACED = re.compile(r"(?<![^\W\d_])((?:[^\W\d_][ .\-_*·]){3,}[^\W\d_])(?![^\W\d_])")
REPEATS = re.compile(r"([^\W\d_])\1{2,}")
WORD = re.compile(r"[\w@$]+")


@dataclass
class Norm:
    text: str
    idx: list  # для каждого символа text: позиция в исходном тексте

    def orig_span(self, s, e):
        if s >= e or not self.idx:
            return 0, 0
        return self.idx[s], self.idx[min(e, len(self.idx)) - 1] + 1


def detect_lang(text):
    low = text.lower()
    kz = sum(1 for ch in low if ch in KZ_LETTERS)
    cyr = len(CYR.findall(low))
    lat = len(re.findall(r"[a-z]", low))
    if kz >= 2:
        return "kk" if kz / max(cyr, 1) > 0.02 else "mix"
    if lat > cyr * 2 and lat > 15:
        return "translit"
    return "ru"


def normalize(text):
    chars = []
    for i, ch in enumerate(text or ""):
        if ch in ZERO_WIDTH:
            continue
        for c in unicodedata.normalize("NFKC", ch).lower():
            chars.append([c, i])

    # маскировка внутри слов, где есть кириллица
    joined = "".join(c for c, _ in chars)
    for m in WORD.finditer(joined):
        w = m.group()
        if not CYR.search(w):
            continue
        for k in range(m.start(), m.end()):
            c = chars[k][0]
            prev_alpha = k > m.start() and joined[k - 1].isalpha()
            next_alpha = k + 1 < m.end() and joined[k + 1].isalpha()
            if c in LAT_TO_CYR:
                chars[k][0] = LAT_TO_CYR[c]
            elif c == "@" and prev_alpha and next_alpha:
                chars[k][0] = LEET[c]
            elif c in LEET and prev_alpha and (next_alpha or k == m.end() - 1):
                chars[k][0] = LEET[c]

    for k in range(len(chars)):
        chars[k][0] = chars[k][0].translate(KZ_FOLD)

    # «к а з и н о» -> «казино»
    joined = "".join(c for c, _ in chars)
    drop = set()
    for m in SPACED.finditer(joined):
        for k in range(m.start(), m.end()):
            if not joined[k].isalpha():
                drop.add(k)
    if drop:
        chars = [c for k, c in enumerate(chars) if k not in drop]

    # «казиииино» -> «казино»
    joined = "".join(c for c, _ in chars)
    drop = set()
    for m in REPEATS.finditer(joined):
        drop.update(range(m.start() + 1, m.end()))
    if drop:
        chars = [c for k, c in enumerate(chars) if k not in drop]

    return Norm("".join(c for c, _ in chars), [i for _, i in chars])


def fold(pattern_text):
    """Привести шаблон словаря к тому же виду, что и нормализованный текст."""
    return pattern_text.translate(KZ_FOLD)
