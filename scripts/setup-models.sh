#!/usr/bin/env bash
# Baixa os modelos Ollama necessários para o Nortear funcionar.
# Execute após: docker compose up -d ollama

set -e

CONTAINER="nortear-ollama"

echo "[1/2] Baixando llama3.2 (~2GB)..."
docker exec "$CONTAINER" ollama pull llama3.2

echo "[2/2] Baixando nomic-embed-text (~274MB)..."
docker exec "$CONTAINER" ollama pull nomic-embed-text

echo ""
echo "Modelos prontos. Verifique com: docker exec $CONTAINER ollama list"
