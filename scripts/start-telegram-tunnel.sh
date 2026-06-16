#!/usr/bin/env bash
# Sobe um túnel público (Cloudflare, sem conta) para o gateway e registra
# o webhook do Telegram automaticamente. Deixe este terminal aberto.
#
# Uso: ./scripts/start-telegram-tunnel.sh
# (lê o TELEGRAM_BOT_TOKEN do .env na raiz do projeto)

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CF_BIN="${CLOUDFLARED_BIN:-$HOME/cloudflared}"
LOG="/tmp/nortear-cloudflared.log"

# Token do .env
TOKEN=$(grep -E '^TELEGRAM_BOT_TOKEN=' "$ROOT_DIR/.env" | cut -d'=' -f2-)
if [ -z "$TOKEN" ] || [ "$TOKEN" = "changeme" ]; then
  echo "ERRO: defina TELEGRAM_BOT_TOKEN no .env"
  exit 1
fi

# Baixa o cloudflared se não existir
if [ ! -x "$CF_BIN" ]; then
  echo "Baixando cloudflared..."
  curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o "$CF_BIN"
  chmod +x "$CF_BIN"
fi

# Inicia o túnel
echo "Iniciando túnel para http://localhost:8080 ..."
"$CF_BIN" tunnel --url http://localhost:8080 > "$LOG" 2>&1 &
CF_PID=$!

# Espera a URL aparecer
URL=""
for i in $(seq 1 20); do
  URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$LOG" | head -1 || true)
  [ -n "$URL" ] && break
  sleep 2
done

if [ -z "$URL" ]; then
  echo "ERRO: não consegui obter a URL do túnel. Veja $LOG"
  kill $CF_PID 2>/dev/null || true
  exit 1
fi

echo "Túnel público: $URL"

# Registra o webhook
WEBHOOK="${URL}/api/v1/telegram/webhook"
RESP=$(curl -s "https://api.telegram.org/bot${TOKEN}/setWebhook" -d "url=${WEBHOOK}" -d 'allowed_updates=["message"]')
echo "Webhook: $RESP"

echo ""
echo "============================================================"
echo " Telegram pronto! Mande uma mensagem ao seu bot para receber"
echo " o código de pareamento e vincule em Perfil -> Telegram."
echo ""
echo " Mantenha este terminal ABERTO (Ctrl+C encerra o túnel)."
echo "============================================================"

# Mantém o túnel vivo em primeiro plano
wait $CF_PID
