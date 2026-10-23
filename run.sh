#!/bin/zsh
# Запуск демо «Белгі»: локальная LLM (если есть модель) + веб-панель на http://127.0.0.1:8090
cd "$(dirname "$0")"
MODEL=models/Qwen3.5-9B-Kazakh.Q4_K_M.gguf
mkdir -p logs
if [ -f "$MODEL" ] && ! curl -s --max-time 1 127.0.0.1:8081/health | grep -q ok; then
  echo "Запускаю LLM…"
  nohup llama-server -m "$MODEL" --port 8081 --host 127.0.0.1 -c 8192 --jinja --reasoning-budget 0 -ngl 99 > logs/llama.log 2>&1 &
  for i in {1..60}; do curl -s --max-time 1 127.0.0.1:8081/health | grep -q ok && break; sleep 1; done
fi
echo "Панель: http://127.0.0.1:8090"
exec .venv/bin/uvicorn belgi.server:app --host 127.0.0.1 --port ${PORT:-8090}
