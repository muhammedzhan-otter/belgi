"""Откуда берутся публикации: демо-лента (синтетика) и публичные Telegram-каналы."""
import hashlib
import html
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
CACHE = Path(os.environ.get("BELGI_CACHE", DATA / "cache"))


def demo_feed():
    return json.loads((DATA / "feed.json").read_text(encoding="utf-8"))


class DemoSource:
    """Имитирует сборщик: каждая проверка забирает следующие N публикаций ленты."""

    def __init__(self):
        self.pos = 0

    def reset(self):
        self.pos = 0

    def fetch(self, limit=10, platform=None):
        feed = [p for p in demo_feed() if not platform or p["platform"] == platform]
        if self.pos >= len(feed):
            return [], True
        batch = feed[self.pos:self.pos + limit]
        self.pos += len(batch)
        for p in batch:
            if p.get("image"):
                p["image"] = str(DATA / p["image"])
        return batch, self.pos >= len(feed)


MSG = re.compile(r'<div class="tgme_widget_message_wrap.*?(?=<div class="tgme_widget_message_wrap|</section>)', re.S)


def clean_channel(channel):
    channel = (channel or "").strip().lstrip("@").replace("https://t.me/", "").replace("t.me/", "").strip("/")
    channel = channel.removeprefix("s/")
    if not re.fullmatch(r"[A-Za-z0-9_]{4,64}", channel):
        raise ValueError("Укажите имя публичного канала, например tengrinews")
    return channel


def parse_telegram_html(text, channel, limit=10):
    """Посты из страницы t.me/s/<канал>. Картинка остаётся ссылкой (image_src)."""
    title = re.search(r'<meta property="og:title" content="([^"]*)"', text)
    posts = []
    for block in MSG.findall(text):
        post_id = re.search(r'data-post="([^"]+)"', block)
        if not post_id:
            continue
        tm = re.search(r'<div class="tgme_widget_message_text[^"]*"[^>]*>(.*?)</div>', block, re.S)
        body = _html_to_text(tm.group(1)) if tm else ""
        links = re.findall(r'<a href="(https?://[^"]+)"', tm.group(1)) if tm else []
        dt = re.search(r'<time datetime="([^"]+)"', block)
        img = re.search(r"tgme_widget_message_photo_wrap[^>]*background-image:url\('([^']+)'\)", block)
        if not body and not img:
            continue
        extra = "\n".join(l for l in links if l not in body)
        posts.append({
            "id": "tg_" + post_id.group(1).replace("/", "_"),
            "platform": "telegram", "kind": "post",
            "account": "@" + channel, "account_name": html.unescape(title.group(1)) if title else channel,
            "ts": dt.group(1) if dt else None,
            "url": "https://t.me/" + post_id.group(1),
            "text": body + ("\n" + extra if extra else ""),
            "image_src": img.group(1) if img else None,
        })
    return posts[-limit:][::-1]


def telegram_public(channel, limit=10, with_images=True):
    """Последние посты публичного канала с веб-страницы t.me/s/<канал> (открытые данные)."""
    import httpx
    channel = clean_channel(channel)
    r = httpx.get(f"https://t.me/s/{channel}", timeout=15, follow_redirects=True,
                  headers={"User-Agent": "Mozilla/5.0 (Belgi demo; public preview)"})
    r.raise_for_status()
    posts = parse_telegram_html(r.text, channel, limit)
    for p in posts:
        src = p.pop("image_src", None)
        if src and with_images:
            p["image"] = _download(src)
    return posts


def _html_to_text(s):
    s = re.sub(r"<br\s*/?>", "\n", s)
    s = re.sub(r"<[^>]+>", "", s)
    return html.unescape(s).strip()


def _download(url):
    import httpx
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / (hashlib.sha1(url.encode()).hexdigest()[:16] + ".jpg")
    if not path.exists():
        try:
            r = httpx.get(url, timeout=15)
            r.raise_for_status()
            if len(r.content) > 8_000_000:
                return None
            path.write_bytes(r.content)
        except httpx.HTTPError:
            return None
    return str(path)
