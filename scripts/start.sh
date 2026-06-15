#!/usr/bin/env bash
# Inicialização completa do Nortear.
# Na primeira execução: baixa modelos e popula vagas.
# Nas próximas: só sobe os serviços.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

FIRST_RUN=false
if ! docker volume ls -q | grep -q "nortear_ollama_data"; then
  FIRST_RUN=true
fi

echo "=== Nortear — Inicialização ==="
echo ""

# 1. Infra
echo "[1/4] Subindo infraestrutura (postgres, kafka, ollama)..."
docker compose up -d postgres-db kafka ollama

echo "      Aguardando postgres e kafka ficarem prontos..."
sleep 20

# 2. Modelos Ollama (só na primeira execução)
if [ "$FIRST_RUN" = true ]; then
  echo ""
  echo "[2/4] Primeira execução: baixando modelos Ollama..."
  bash "$SCRIPT_DIR/setup-models.sh"
else
  echo "[2/4] Modelos Ollama já baixados. Pulando."
fi

# 3. Serviços
echo ""
echo "[3/4] Subindo todos os serviços..."
docker compose up -d --build

echo "      Aguardando serviços iniciarem..."
sleep 15

# 4. Vagas (só na primeira execução)
if [ "$FIRST_RUN" = true ]; then
  echo ""
  echo "[4/4] Primeira execução: populando banco de vagas..."
  bash "$SCRIPT_DIR/populate-vagas.sh"
else
  echo "[4/4] Banco já populado. Para re-popular: ./scripts/populate-vagas.sh"
fi

echo ""
echo "============================================"
echo " Nortear está rodando!"
echo " Frontend: http://localhost:3000"
echo " API:      http://localhost:8080"
echo ""
echo " Para integrar o Telegram:"
echo "   1. ngrok http 8080"
echo "   2. ./scripts/setup-telegram.sh <TOKEN> <URL_NGROK>"
echo "============================================"
