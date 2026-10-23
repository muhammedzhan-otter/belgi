"""Публикация «Белгі» на Hugging Face Spaces (Docker). С октября 2026 Docker-Spaces на cpu-basic
требуют подписку PRO, поэтому публичная версия живёт на Cloudflare (README).
Запуск: python3 scripts/deploy_hf.py [имя_пользователя/имя_space]
Токен берётся из `hf auth login`. В Space уходят только код и демо-данные, без docs/."""
import sys
from pathlib import Path

from huggingface_hub import HfApi

ROOT = Path(__file__).resolve().parent.parent
REPO = sys.argv[1] if len(sys.argv) > 1 else "Cyber20052005/belgi"

SPACE_README = """---
title: Белгі — признаки схем в соцсетях
emoji: 🛡️
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: true
short_description: Признаки незаконных розыгрышей, казино и пирамид в соцсетях
---

# Белгі

Прототип для хакатона SafeNet KZ. Панель аналитика находит в публикациях соцсетей и мессенджеров признаки
платных розыгрышей, скрытой рекламы онлайн-казино и финансовых пирамид на русском, казахском и транслите,
ставит уровень риска и объясняет его цитатами и нормами законодательства РК.

Система не объявляет схему незаконной: она показывает признаки возможного нарушения, решение принимает специалист.

Что попробовать:
- «Найти и проверить» по демо-ленте (синтетические публикации, скриншоты, транскрипции эфиров);
- «Telegram-канал»: последние посты любого публичного канала;
- «Автопоиск по цепочке»: от стартовых каналов по ссылкам к другим каналам;
- вкладки «Связи», «Проверить пример», «Метрики»; в карточке кейса кнопка «Справка для ведомства».
"""

api = HfApi()
api.create_repo(REPO, repo_type="space", space_sdk="docker", private=False, exist_ok=True)
api.upload_folder(
    repo_id=REPO, repo_type="space", folder_path=str(ROOT),
    allow_patterns=["Dockerfile", "requirements.txt", "belgi/*.py", "web/**", "data/feed.json", "data/img/*.png",
                    "scripts/make_images.py"],
    ignore_patterns=["**/__pycache__/**", "*.pyc"],
    commit_message="Обновление Белгі",
)
api.upload_file(repo_id=REPO, repo_type="space", path_or_fileobj=SPACE_README.encode("utf-8"),
                path_in_repo="README.md", commit_message="README для Space")
user, name = REPO.split("/")
print(f"https://huggingface.co/spaces/{REPO}")
print(f"https://{user.lower()}-{name.lower()}.hf.space")
