"""Текст со скриншотов: Tesseract с казахским и русским."""
import shutil
from functools import lru_cache
from pathlib import Path

TESSERACT = shutil.which("tesseract") or "/opt/homebrew/bin/tesseract"


def available():
    return Path(TESSERACT).exists()


@lru_cache(maxsize=512)
def _run(path, mtime):
    import subprocess
    try:
        out = subprocess.run([TESSERACT, path, "stdout", "-l", "eng+rus+kaz", "--psm", "3"],
                             capture_output=True, text=True, timeout=60)
    except (OSError, subprocess.TimeoutExpired):
        return ""
    lines = [ln.strip() for ln in out.stdout.splitlines() if ln.strip()]
    return "\n".join(lines)


def image_text(path):
    p = Path(path)
    if not p.exists() or not available():
        return ""
    return _run(str(p), p.stat().st_mtime)
