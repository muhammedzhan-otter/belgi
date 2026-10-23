# Белгі: панель аналитика. Подходит для Hugging Face Spaces (порт 7860) и для любого компьютера с Docker.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=7860 \
    BELGI_CACHE=/tmp/belgi/cache BELGI_UPLOADS=/tmp/belgi/uploads

RUN apt-get update \
 && apt-get install -y --no-install-recommends tesseract-ocr tesseract-ocr-rus tesseract-ocr-kaz \
 && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 user
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=user belgi ./belgi
COPY --chown=user web ./web
COPY --chown=user data/feed.json ./data/feed.json
COPY --chown=user data/img ./data/img

USER user
EXPOSE 7860
CMD uvicorn belgi.server:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips="*"
