"""Автономный мониторинг Шымкента: по расписанию обходит открытые Telegram-каналы города
и каналы, на которые они ссылаются, и сохраняет только схемы, привязанные к Шымкенту.

    python -m belgi.monitor               каждые 15 минут, пока не остановят
    python -m belgi.monitor --once        один обход
    python -m belgi.monitor --every 30 --channels 12

Результат в data/shymkent/: cases.json (все шымкентские публикации с уровнем риска),
channels.json (что обошли), reports/<кейс>.html (справка для каждой схемы)."""
import argparse
import json
import time
from datetime import datetime

from . import core, crawl, geo, sources

OUT = sources.DATA / "shymkent"


def run_once(S, max_channels=10):
    before = set(S["results"])
    t0 = time.perf_counter()
    report = crawl.crawl(geo.SEEDS, lambda posts: core.process(S, posts), max_channels=max_channels, local=True)
    new = [S["results"][i] for i in S["results"] if i not in before]
    local = [r for r in S["results"].values() if r["geo"]["city"] == geo.CITY]
    risky = [r for r in new if r["geo"]["city"] == geo.CITY and r["level"] != "low"]

    (OUT / "reports").mkdir(parents=True, exist_ok=True)
    views = sorted((core.view(r, False) for r in local),
                   key=lambda v: (-core.engine.LEVELS.index(v["level"]), -v["score"], v["id"]))
    (OUT / "cases.json").write_text(json.dumps(views, ensure_ascii=False, indent=1), encoding="utf-8")
    (OUT / "channels.json").write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    for r in risky:
        (OUT / "reports" / f"{r['id']}.html").write_text(core.report_html(r), encoding="utf-8")

    stamp = datetime.now().strftime("%d.%m %H:%M")
    print(f"[{stamp}] каналов {len(report)}, новых публикаций {len(new)}, "
          f"из них про Шымкент {sum(1 for r in new if r['geo']['city'] == geo.CITY)}, "
          f"схем {len(risky)} ({time.perf_counter() - t0:.1f} с)", flush=True)
    for r in risky:
        v = core.view(r, False)
        print(f"   {v['level_ru'].upper():8} {v['score']:3}  {v['track_ru']}  {v['account']}  {v['url'] or ''}", flush=True)
    return risky


def main():
    ap = argparse.ArgumentParser(description="Автономный мониторинг схем в Шымкенте")
    ap.add_argument("--every", type=float, default=15, help="интервал между обходами, минут")
    ap.add_argument("--channels", type=int, default=10, help="сколько каналов за один обход")
    ap.add_argument("--once", action="store_true", help="один обход и выход")
    a = ap.parse_args()
    S = core.new_state()
    print(f"Мониторинг Шымкента: старт с {', '.join('@' + s for s in geo.SEEDS)}; результаты в {OUT}", flush=True)
    while True:
        try:
            run_once(S, a.channels)
        except Exception as e:  # сеть пропала: пробуем в следующий раз
            print("обход не удался:", e, flush=True)
        if a.once:
            break
        time.sleep(a.every * 60)


if __name__ == "__main__":
    main()
