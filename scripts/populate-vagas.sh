#!/usr/bin/env bash
# Executa o scraper de vagas e depois processa/vetoriza os dados.
# Requer que postgres, kafka e embedding-service estejam rodando.

set -e

COMPOSE="docker compose"

echo ">>> [1/2] Rodando scraper (coleta vagas da Gupy)..."
$COMPOSE --profile jobs run --rm data-scraper

echo ""
echo ">>> [2/2] Processando vagas (extrai skills, publica no Kafka → embedding)..."
$COMPOSE --profile jobs run --rm data-scraper python process.py

echo ""
echo "Pronto! Vagas coletadas e enviadas para vetorização."
echo "O embedding-service vai consumir do Kafka e popular o pgvector em instantes."
