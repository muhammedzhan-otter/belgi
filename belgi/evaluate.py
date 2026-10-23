"""Метрики на размеченной демо-ленте: precision, recall, доля ложных срабатываний."""
import json
from pathlib import Path

from . import engine, ocr, sources


_ocr_cache = None


def prepare(post):
    """Текст со скриншота. Если OCR недоступен (браузер), для демо-ленты берём текст,
    заранее распознанный тем же Tesseract (scripts/build_web.py)."""
    global _ocr_cache
    if post.get("image") and not post.get("ocr_text"):
        if ocr.available():
            post["ocr_text"] = ocr.image_text(post["image"])
        else:
            if _ocr_cache is None:
                f = sources.DATA / "ocr_cache.json"
                _ocr_cache = json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}
            post["ocr_text"] = _ocr_cache.get(Path(post["image"]).name, "")
    return post


def run_feed():
    feed = sources.demo_feed()
    for p in feed:
        if p.get("image"):
            p["image"] = str(sources.DATA / p["image"])
        prepare(p)
    results = engine.apply_network([engine.analyze(p) for p in feed])
    return results


def metrics(results, threshold="medium"):
    """Положительный класс: уровень не ниже threshold и верный трек."""
    rank = engine.LEVELS.index(threshold)
    rows = []
    for track in ["lottery", "casino", "pyramid", None]:
        tp = fp = fn = tn = 0
        for r in results:
            lab = r.get("label") or {}
            truth = lab.get("risk") in ("high", "medium") and (track is None or lab.get("track") == track)
            pred = engine.LEVELS.index(r["level"]) >= rank and (track is None or r["track"] == track)
            tp += truth and pred
            fp += (not truth) and pred
            fn += truth and not pred
            tn += (not truth) and not pred
        rows.append({
            "track": track or "all",
            "precision": round(tp / (tp + fp), 3) if tp + fp else None,
            "recall": round(tp / (tp + fn), 3) if tp + fn else None,
            "fpr": round(fp / (fp + tn), 3) if fp + tn else None,
            "tp": tp, "fp": fp, "fn": fn, "tn": tn,
        })
    hard = [r for r in results if (r.get("label") or {}).get("risk") == "low"]
    flagged = [r["id"] for r in hard if engine.LEVELS.index(r["level"]) >= rank]
    return {"threshold": threshold, "rows": rows, "negatives": len(hard), "false_alarms": flagged,
            "total": len(results)}


if __name__ == "__main__":
    res = run_feed()
    for r in res:
        lab = r.get("label") or {}
        ok = (lab.get("risk") == "low") == (r["level"] == "low") and (lab.get("risk") == "low" or lab.get("track") == r["track"])
        print(f"{'  ' if ok else '❌'} {r['id']:7} ожид {str(lab.get('track')):8} {lab.get('risk'):6} | "
              f"{str(r['track']):8} {r['level']:6} {r['score']:3} | {r['summary']}")
    for th in ("medium", "high"):
        m = metrics(res, th)
        print(th, [(x["track"], x["precision"], x["recall"], x["fpr"]) for x in m["rows"]], "ложные:", m["false_alarms"])
