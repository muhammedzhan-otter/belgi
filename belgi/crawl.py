"""Автопоиск по публичным Telegram-каналам «по цепочке»: проверяем стартовые каналы,
берём из постов ссылки и упоминания других каналов и идём дальше. Каналы, на которые
ссылаются подозрительные посты, проверяются первыми. Только открытые веб-превью t.me/s/."""
import re
from concurrent.futures import ThreadPoolExecutor

from . import core, sources

REF = re.compile(r"(?:https?://)?(?:t\.me|telegram\.me)/(?!\+|joinchat|s/|share|addstickers|proxy|iv\b|c/)([A-Za-z0-9_]{5,32})", re.I)
MENTION = re.compile(r"(?<![\w.])@([A-Za-z][A-Za-z0-9_]{4,31})\b")
SKIP = {"telegram", "durov", "botfather", "share", "addstickers"}


def channel_refs(text):
    names = {m.group(1) for m in REF.finditer(text or "")} | {m.group(1) for m in MENTION.finditer(text or "")}
    return {n.lower() for n in names if n.lower() not in SKIP and not n.lower().endswith("bot")}


def _fetch(name, posts_per_channel, with_images):
    try:
        return name, sources.telegram_public(name, posts_per_channel, with_images=with_images), None
    except Exception as e:  # закрытый канал, нет превью, сеть
        return name, [], str(e)[:120]


def crawl(seeds, process, max_channels=12, posts_per_channel=10, workers=6, with_images=True):
    """process(posts) -> список результатов анализа (уже добавленных в сессию)."""
    seeds = [s.strip().lstrip("@").replace("https://t.me/", "").replace("t.me/", "").strip("/") for s in seeds]
    queue = [(s.lower(), None, 0) for s in seeds if re.fullmatch(r"[A-Za-z0-9_]{4,64}", s)]
    seen, report = set(), []
    while queue and len(seen) < max_channels:
        # каналы со ссылками из рискованных постов вперёд
        queue.sort(key=lambda x: -x[2])
        batch = []
        while queue and len(seen) + len(batch) < max_channels:
            name, parent, prio = queue.pop(0)
            if name in seen or any(b[0] == name for b in batch):
                continue
            batch.append((name, parent, prio))
        if not batch:
            break
        with ThreadPoolExecutor(max_workers=workers) as ex:
            fetched = list(ex.map(lambda b: _fetch(b[0], posts_per_channel, with_images), batch))
        for (name, parent, _), (_, posts, err) in zip(batch, fetched):
            seen.add(name)
            results = process(posts) if posts else []
            entry, refs = core.crawl_entry(name, parent, results)
            entry["error"] = err if not posts else None
            report.append(entry)
            for ref, weight in refs.items():
                if ref not in seen:
                    queue.append((ref, name, weight))
    return report
