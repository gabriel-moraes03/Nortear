#!/usr/bin/env bash
# Registra o webhook do Telegram para o bot receber mensagens.
# Uso: ./scripts/setup-telegram.sh <TOKEN> <URL_PUBLICA>
# Exemplo local com ngrok: ./scripts/setup-telegram.sh 123:ABC https://abc123.ngrok.io
# Exemplo produção:        ./scripts/setup-telegram.sh 123:ABC https://meudominio.com

set -e

TOKEN="${1:-$TELEGRAM_BOT_TOKEN}"
BASE_URL="${2}"

if [ -z "$TOKEN" ] || [ "$TOKEN" = "changeme" ]; then
  echo "ERRO: Forneça o token do bot como primeiro argumento ou defina TELEGRAM_BOT_TOKEN no .env"
  echo "Uso: $0 <TOKEN> <URL_BASE>"
  exit 1
fi

if [ -z "$BASE_URL" ]; then
  echo "ERRO: Forneça a URL pública do servidor como segundo argumento."
  echo "Uso: $0 <TOKEN> <URL_BASE>"
  echo ""
  echo "Para desenvolvimento local, use ngrok:"
  echo "  ngrok http 8080"
  echo "  $0 <TOKEN> https://<id>.ngrok.io"
  exit 1
fi

WEBHOOK_URL="${BASE_URL}/api/v1/telegram/webhook"

echo "Registrando webhook: $WEBHOOK_URL"

RESPONSE=$(curl -s "https://api.telegram.org/bot${TOKEN}/setWebhook" \
  -d "url=${WEBHOOK_URL}" \
  -d "allowed_updates=[\"message\"]")

echo "Resposta do Telegram: $RESPONSE"

if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo ""
  echo "Webhook registrado com sucesso!"
else
  echo ""
  echo "ERRO ao registrar webhook. Verifique o token e a URL."
  exit 1
fi
