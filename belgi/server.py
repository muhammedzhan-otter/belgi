"""Веб-сервер панели аналитика «Белгі». У каждого посетителя своя сессия (cookie)."""
import os
import threading
import time
import uuid
from collections import OrderedDict, defaultdict, deque
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import core
from . import crawl as crawler
from . import engine, geo, llm, lexicon as lx, ocr, sources

ROOT = Path(__file__).resolve().parent.parent
UPLOADS = Path(os.environ.get("BELGI_UPLOADS", ROOT / "data" / "uploads"))

MAX_SESSIONS = 300
MAX_UPLOAD = 5 * 1024 * 1024
MAX_TEXT = 6000
RATE = (40, 60)              # не больше 40 тяжёлых запросов в минуту с одного адреса

app = FastAPI(title="Белгі")
SESSIONS: "OrderedDict[str, dict]" = OrderedDict()
_lock = threading.Lock()
_hits = defaultdict(deque)


class ScanReq(BaseModel):
    source: str = "demo"
    channel: str | None = None
    limit: int = 10
    platform: str | None = None
    use_llm: bool = True


class CrawlReq(BaseModel):
    seeds: str
    max_channels: int = 10
    use_llm: bool = False


class ShymReq(BaseModel):
    use_llm: bool = False


class ReviewReq(BaseModel):
    ids: list[str] = []


class FeedbackReq(BaseModel):
    verdict: str  # confirmed | false_positive | sent


def session(request: Request, response: Response):
    # заголовок и ?sid= нужны, когда страница открыта во фрейме и браузер режет cookie
    sid = (request.headers.get("x-belgi-session") or request.query_params.get("sid")
           or request.cookies.get("belgi_sid") or "")
    sid = sid if len(sid) == 32 and sid.isalnum() else ""
    with _lock:
        if not sid or sid not in SESSIONS:
            sid = sid or uuid.uuid4().hex
            SESSIONS[sid] = core.new_state()
            while len(SESSIONS) > MAX_SESSIONS:
                SESSIONS.popitem(last=False)
        SESSIONS.move_to_end(sid)
    response.set_cookie("belgi_sid", sid, max_age=7 * 24 * 3600, httponly=True, samesite="none", secure=True)
    response.headers["X-Belgi-Session"] = sid
    return SESSIONS[sid]


def rate_limit(request: Request):
    ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "?").split(",")[0].strip()
    q, now = _hits[ip], time.time()
    while q and now - q[0] > RATE[1]:
        q.popleft()
    if len(q) >= RATE[0]:
        raise HTTPException(429, "Слишком много запросов, подождите минуту")
    q.append(now)


def _process(S, posts, use_llm):
    new = core.process(S, posts)
    llm_used = 0
    if use_llm and llm.available():
        for r in new:
            if llm.review(r):
                llm_used += 1
    return new, llm_used


@app.get("/api/status")
def status(request: Request, response: Response):
    S = session(request, response)
    return {"ocr": ocr.available(), "llm": llm.available(), "llm_model": llm.MODEL_NAME,
            "tracks": lx.TRACKS, "stats": core.stats(S),
            "city": {"id": geo.CITY, "label": geo.CITY_RU, "seeds": geo.SEEDS}}


@app.post("/api/scan")
def scan(req: ScanReq, request: Request, response: Response):
    rate_limit(request)
    S = session(request, response)
    t0 = time.perf_counter()
    done = False
    if req.source == "telegram":
        try:
            posts = sources.telegram_public(req.channel or "", max(1, min(req.limit, 20)))
        except ValueError as e:
            raise HTTPException(400, str(e))
        except Exception as e:
            raise HTTPException(502, f"Не удалось открыть канал: {e}")
    else:
        posts, done = S["demo"].fetch(max(1, min(req.limit, 50)), req.platform)
    new, llm_used = _process(S, posts, req.use_llm)
    return {"found": len(new), "elapsed": round(time.perf_counter() - t0, 2), "done": done, "llm_used": llm_used,
            "images": sum(1 for r in new if r.get("image")), "new_ids": [r["id"] for r in new],
            "cases": core.sorted_views(S), "stats": core.stats(S)}


@app.post("/api/crawl")
def crawl(req: CrawlReq, request: Request, response: Response):
    rate_limit(request)
    S = session(request, response)
    if S["busy"]:
        raise HTTPException(409, "Автопоиск уже идёт")
    seeds = [s for s in req.seeds.replace("\n", ",").replace(" ", ",").split(",") if s.strip()][:10]
    if not seeds:
        raise HTTPException(400, "Укажите хотя бы один публичный канал")
    S["busy"] = True
    t0 = time.perf_counter()
    before = set(S["results"])
    try:
        report = crawler.crawl(seeds, lambda posts: _process(S, posts, req.use_llm)[0],
                               max_channels=max(1, min(req.max_channels, 20)))
    finally:
        S["busy"] = False
    new_ids = [i for i in S["results"] if i not in before]
    return {"channels": report, "elapsed": round(time.perf_counter() - t0, 1), "new_ids": new_ids,
            "cases": core.sorted_views(S), "stats": core.stats(S)}


@app.post("/api/shym")
def shym(req: ShymReq, request: Request, response: Response):
    """Режим «Шымкент» на своём сервере: обход каналов города прямо сейчас.
    Круглосуточный обход по расписанию делает python -m belgi.monitor."""
    rate_limit(request)
    S = session(request, response)
    if S["busy"]:
        raise HTTPException(409, "Обход уже идёт")
    S["busy"] = True
    t0 = time.perf_counter()
    before = set(S["results"])
    try:
        report = crawler.crawl(geo.SEEDS, lambda posts: _process(S, posts, req.use_llm)[0], max_channels=8, local=True)
    finally:
        S["busy"] = False
    new_ids = [i for i in S["results"] if i not in before]
    if report and all(e.get("error") for e in report) and not new_ids:
        raise HTTPException(502, "Каналы не ответили")
    return {"channels": _channel_rows(S, report), "elapsed": round(time.perf_counter() - t0, 1), "new_ids": new_ids,
            "cases": core.sorted_views(S), "stats": core.stats(S), "collector": None}


def _channel_rows(S, report):
    """Строки каналов по всей сессии, а не только по новым постам этого обхода."""
    known = S.setdefault("shym_channels", {})
    for e in report:
        c = known.setdefault(e["channel"], {"channel": e["channel"], "from": e.get("from"), "title": None})
        c["title"] = e.get("title") or c["title"]
        c["error"] = e.get("error")
    rows = []
    for name, c in known.items():
        mine = [r for r in S["results"].values() if r["account"] == "@" + name]
        rows.append({**c, "title": c["title"] or (mine[0].get("account_name") if mine else None), "last": None,
                     "posts": len(mine), "high": sum(r["level"] == "high" for r in mine),
                     "medium": sum(r["level"] == "medium" for r in mine),
                     "local": sum(r["geo"]["city"] == geo.CITY for r in mine), "signs": [],
                     "tracks": sorted({r["track"] for r in mine if r["level"] != "low" and r["track"]})})
    return rows


@app.post("/api/review")
def review(req: ReviewReq, request: Request, response: Response):
    """LLM уточняет спорные случаи уже после того, как результат правил показан."""
    rate_limit(request)
    S = session(request, response)
    cands = []
    if llm.available():
        cands = [r for r in (S["results"].get(cid) for cid in req.ids[:60]) if r and llm.build_request(r)]
    used = sum(1 for r in cands if llm.review(r))
    return {"llm_used": used, "llm_total": len(cands), "cases": core.sorted_views(S), "stats": core.stats(S)}


@app.get("/api/cases")
def cases(request: Request, response: Response):
    S = session(request, response)
    return {"cases": core.sorted_views(S), "stats": core.stats(S)}


@app.get("/api/case/{cid}")
def case(cid: str, request: Request, response: Response):
    S = session(request, response)
    r = S["results"].get(cid)
    if not r:
        raise HTTPException(404, "Нет такого кейса")
    return core.view(r)


@app.get("/api/image/{cid}")
def image(cid: str, request: Request, response: Response):
    S = session(request, response)
    r = S["results"].get(cid)
    if not r or not r.get("image") or not Path(r["image"]).exists():
        raise HTTPException(404)
    return FileResponse(r["image"])


@app.post("/api/analyze")
async def analyze_custom(request: Request, response: Response, text: str = Form(""),
                         file: UploadFile | None = File(None), use_llm: bool = Form(True), demo: bool = Form(False)):
    rate_limit(request)
    S = session(request, response)
    cid = "man_" + uuid.uuid4().hex[:6]
    post = {"id": cid, "platform": "manual", "kind": "manual", "account": "Ручная проверка",
            "ts": datetime.now().astimezone().isoformat(timespec="minutes"), "text": text[:MAX_TEXT], "demo": demo}
    if file and file.filename:
        suffix = Path(file.filename).suffix.lower()
        if suffix not in {".png", ".jpg", ".jpeg", ".webp"}:
            raise HTTPException(400, "Нужна картинка PNG или JPG")
        data = await file.read(MAX_UPLOAD + 1)
        if len(data) > MAX_UPLOAD:
            raise HTTPException(400, "Картинка больше 5 МБ")
        UPLOADS.mkdir(parents=True, exist_ok=True)
        path = UPLOADS / f"{cid}{suffix}"
        path.write_bytes(data)
        post["image"] = str(path)
    if not post["text"].strip() and not post.get("image"):
        raise HTTPException(400, "Вставьте текст или приложите скриншот")
    _process(S, [post], use_llm)
    if cid not in S["results"]:
        raise HTTPException(400, "Достигнут предел публикаций в сессии, нажмите «Сбросить»")
    return core.view(S["results"][cid])


@app.post("/api/feedback/{cid}")
def feedback(cid: str, req: FeedbackReq, request: Request, response: Response):
    fb = core.feedback(session(request, response), cid, req.verdict)
    if not fb:
        raise HTTPException(404)
    return {"ok": True, "feedback": fb}


@app.post("/api/reset")
def reset(request: Request, response: Response):
    S = session(request, response)
    S["results"].clear()
    S["posts"].clear()
    S.pop("shym_channels", None)
    S["demo"].reset()
    return {"ok": True}


@app.get("/api/graph")
def graph(request: Request, response: Response, city: str | None = None):
    return core.graph(session(request, response), city or None)


@app.get("/api/metrics")
def metrics():
    return core.metrics()


@app.get("/api/report/{cid}", response_class=HTMLResponse)
def report(cid: str, request: Request, response: Response):
    r = session(request, response)["results"].get(cid)
    if not r:
        raise HTTPException(404)
    return core.report_html(r)


app.mount("/", StaticFiles(directory=ROOT / "web", html=True), name="web")
