# Nortear

Plataforma de orientação de carreira em tecnologia que combina **busca semântica (RAG)** sobre vagas reais com um **assistente de IA local (Ollama)**, construída em arquitetura de **microsserviços** com comunicação assíncrona via **Kafka**.

O usuário cadastra seu perfil (skills + objetivo de carreira), o sistema vetoriza esse perfil, coleta vagas do mercado, e o assistente recomenda vagas compatíveis e traça roadmaps — tudo com os dados rodando localmente.

---

## Sumário

- [Visão geral da arquitetura](#visão-geral-da-arquitetura)
- [Serviços](#serviços)
- [Padrões arquiteturais](#padrões-arquiteturais)
  - [Saga (coreografia)](#saga-coreografia)
  - [CQRS](#cqrs)
  - [MCP (Model Context Protocol)](#mcp-model-context-protocol)
  - [RAG (Retrieval-Augmented Generation)](#rag-retrieval-augmented-generation)
- [Stack tecnológica](#stack-tecnológica)
- [Fluxos principais](#fluxos-principais)
- [Bancos de dados](#bancos-de-dados)
- [Tópicos Kafka](#tópicos-kafka)
- [Como rodar](#como-rodar)
- [Variáveis de ambiente](#variáveis-de-ambiente)

---

## Visão geral da arquitetura

```
                              ┌─────────────┐
                              │  Frontend   │  React + nginx (porta 3000)
                              └──────┬──────┘
                                     │ /api/**
                              ┌──────▼──────┐
                              │   Gateway   │  Spring Boot (porta 8080)
                              └──┬───────┬──┘
                  /api/auth/**   │       │   /api/v1/chats, /api/vagas, /api/v1/telegram
                  /api/users/**  │       │
                          ┌──────▼──┐  ┌─▼─────────┐
                          │  auth-  │  │   chat-   │
                          │ service │  │  service  │
                          │  :8081  │  │   :8082   │
                          └────┬────┘  └─┬───────┬─┘
                               │         │       │ HTTP
                               │         │     ┌─▼──────────┐
                               │         │     │ mcp-server │  Node.js (:8000)
                               │         │     └─┬──────────┘
                               │         │       │ HTTP        ┌──────────┐
                               │         │       ├────────────▶│  Ollama  │  LLM + embeddings
                               │         │       │             └──────────┘
                               │         │     ┌─▼──────────────┐
                               │         │     │ embedding-svc  │  Python/FastAPI (:8001)
                               │         │     └─┬──────────────┘
                               │         │       │
        ┌──────────┐           │  Kafka  │       │  pgvector
        │  Kafka   │◀──────────┴────●────┴───────┘
        └──────────┘    (eventos assíncronos)
                                     │
                              ┌──────▼──────┐
                              │  PostgreSQL │  (+ extensão pgvector)
                              └─────────────┘

        ┌───────────────┐   job manual
        │ data-service  │   scrape.py → process.py → Kafka
        │  (scraper)    │
        └───────────────┘
```

---

## Serviços

| Serviço | Porta | Stack | Responsabilidade |
|---|---|---|---|
| **frontend** | 3000 | React + TS + Vite + Tailwind, servido por nginx | Interface web (login, chat, vagas, perfil, Telegram) |
| **gateway** | 8080 | Spring Boot 4 / Java 21 | API Gateway — roteia e encaminha requisições para os serviços internos |
| **auth-service** | 8081 | Spring Boot 4 / Java 21 | Autenticação JWT, cadastro, gestão de usuários, skills e metas. Inicia a saga de registro |
| **chat-service** | 8082 | Spring Boot 4 / Java 21 | Sessões e mensagens de chat, orquestração do MCP, busca de vagas, integração com Telegram |
| **mcp-server** | 8000 | Node.js + Express | Camada de IA — recebe prompts, executa o RAG e chama o LLM no Ollama |
| **embedding-service** | 8001 | Python + FastAPI | Geração de embeddings (Ollama) e busca semântica no pgvector |
| **data-service** | — (job) | Python + Playwright | Scraping de vagas (Gupy) e processamento/extração de skills |
| **ollama** | 11434 | Ollama | Modelos locais: `qwen2.5:1.5b` (chat) e `nomic-embed-text` (embeddings) |
| **kafka** | 9092 | Apache Kafka (KRaft) | Mensageria assíncrona entre serviços |
| **postgres** | 5432 | PostgreSQL 15 + pgvector | Persistência relacional + vetorial |

---

## Padrões arquiteturais

### Saga (coreografia)

O cadastro de usuário é uma transação distribuída que cruza três serviços. Usamos o padrão **Saga por coreografia** (sem orquestrador central — cada serviço reage a eventos):

```
1. auth-service     → salva usuário com status PENDING_CONFIRMATION
                    → publica  [user-registration-events]
2. chat-service     → consome [user-registration-events]
                    → chama o mcp-server para inicializar o perfil
                    → mcp-server → embedding-service gera o embedding do perfil
                    → publica  [user-profile-events] (SUCCESS / FAILED)
3. auth-service     → consome [user-profile-events]
                    → atualiza status para ACTIVE ou REGISTRATION_FAILED
```

Isso garante **consistência eventual**: o usuário é criado imediatamente, e seu perfil vetorial é construído de forma assíncrona. Se a vetorização falhar, o status reflete isso sem travar o cadastro.

### CQRS

A separação **Command/Query** está presente na fundação do sistema:

- O banco define réplicas de leitura (`auth_db_replica`, `vagas_db_replica`) destinadas a separar a carga de leitura da de escrita.
- A comunicação por eventos via Kafka é a base para projeções de leitura independentes das escritas (consistência eventual).

> **Estado atual:** cada serviço usa um único datasource para leitura e escrita; as réplicas existem como preparação de infraestrutura. A separação total de read/write models é o próximo passo evolutivo — a arquitetura orientada a eventos já habilita esse caminho sem reescrita.

### MCP (Model Context Protocol)

O **mcp-server** é uma camada que abstrai a interação com o modelo de IA. O chat-service nunca fala direto com o LLM — ele fala com o MCP, que:

- Monta o contexto da conversa (histórico + system prompt com guardrails de tema);
- Executa o **RAG** (busca de vagas relevantes);
- Chama o Ollama e devolve a resposta.

Esse desacoplamento permite trocar o modelo (de `llama3.2` para `qwen2.5`, por exemplo) ou o provedor de IA **sem tocar no backend Java** — basta mudar variáveis de ambiente.

### RAG (Retrieval-Augmented Generation)

O assistente não responde "no vácuo": ele é alimentado com vagas reais semanticamente compatíveis com o perfil do usuário.

```
Indexação:
  vaga processada → nomic-embed-text (768 dim) → pgvector (vaga_embedding)
  perfil usuário  → nomic-embed-text (768 dim) → pgvector (perfil_usuario)

Consulta (a cada mensagem do chat):
  mcp-server → embedding-service /search/vagas?userId=X
             → busca por distância de cosseno (operador <=>, índice HNSW)
             → top-N vagas mais próximas do perfil
             → injeta as vagas no contexto do LLM
```

Quando **não há vagas indexadas**, o MCP é transparente: avisa que a base ainda está vazia e orienta com base nas skills do usuário, sem inventar vagas.

---

## Stack tecnológica

**Backend (Java)**
- Java 21, Spring Boot 4.0.6
- Spring Security 6 (JWT stateless, sem sessão)
- Spring Data JPA + Hibernate, Flyway (migrations)
- Spring Kafka

**IA / dados**
- Node.js 20 + Express + `ollama` (cliente)
- Python 3.12 + FastAPI + psycopg2 + pgvector + kafka-python
- Playwright (scraping)
- Ollama: `qwen2.5:1.5b` (chat), `nomic-embed-text` (embeddings)

**Frontend**
- React 18 + TypeScript + Vite
- TailwindCSS + React Router

**Infraestrutura**
- PostgreSQL 15 + extensão pgvector
- Apache Kafka (modo KRaft, sem Zookeeper)
- Docker Compose
- nginx (serve o frontend e faz proxy reverso para o gateway)

---

## Fluxos principais

### 1. Cadastro (Saga)
`frontend → gateway → auth-service` salva o usuário e dispara a saga descrita acima. Status evolui de `PENDING_CONFIRMATION` → `ACTIVE`.

### 2. Chat com RAG
```
frontend → gateway → chat-service (cria sessão, salva mensagem)
         → mcp-server (busca vagas no embedding-service + monta contexto)
         → Ollama (gera resposta)
         → resposta salva e devolvida ao usuário
```

### 3. Pipeline de vagas
```
data-service: scrape.py  → vaga_bruta            (coleta da Gupy)
data-service: process.py → vaga_processada       (extrai skills/senioridade)
                         → publica [vaga-processada-events]
embedding-service        → consome o evento
                         → gera embedding (Ollama)
                         → grava em vaga_embedding (pgvector)
```

### 4. Telegram
Pareamento por código: o usuário envia uma mensagem ao bot, recebe um código de 6 caracteres, e cola na aba **Perfil → Telegram**. A partir daí, conversa com o assistente direto pelo Telegram.

---

## Bancos de dados

| Banco | Dono | Conteúdo |
|---|---|---|
| `auth_db` | auth-service | users, skill, goal |
| `auth_db_replica` | (CQRS — réplica de leitura) | preparação de infraestrutura |
| `chat_db` | chat-service | chat_session, chat_message, telegram_user_mapping |
| `vagas_db` | data-service | vaga_bruta, vaga_processada, skill, vaga_skill_rel |
| `vagas_db_replica` | (CQRS — réplica de leitura) | preparação de infraestrutura |
| `vector_db` | embedding-service | perfil_usuario, vaga_embedding (vetores de 768 dim, índice HNSW) |

---

## Tópicos Kafka

| Tópico | Produtor | Consumidor | Payload |
|---|---|---|---|
| `user-registration-events` | auth-service | chat-service | `{ userId, vagaDesejada, skills[] }` |
| `user-profile-events` | chat-service | auth-service | `{ userId, status }` |
| `vaga-processada-events` | data-service | embedding-service | dados da vaga processada |

---

## Como rodar

> Pré-requisitos: Docker + Docker Compose.

Existem scripts auxiliares em [`scripts/`](scripts/):

```bash
# 1. Sobe a infraestrutura
docker compose up -d postgres-db kafka ollama

# 2. Baixa os modelos de IA (~1.5 GB no total)
./scripts/setup-models.sh

# 3. Sobe todos os serviços
docker compose up -d --build

# 4. Popula o banco de vagas (scraper + processamento + vetorização)
./scripts/populate-vagas.sh
```

Acesso:
- **Frontend:** http://localhost:3000
- **API (gateway):** http://localhost:8080

**Telegram (opcional):**
```bash
ngrok http 8080
./scripts/setup-telegram.sh <TOKEN> <URL_NGROK>
```

---

## Variáveis de ambiente

Configuradas no arquivo `.env` na raiz:

| Variável | Descrição | Padrão |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` | Credenciais do PostgreSQL | `root` / `rootpassword` |
| `JWT_SECRET` | Chave de assinatura dos tokens JWT | — (defina uma forte) |
| `JWT_EXPIRATION` | Validade do token (ms) | `3600000` |
| `KAFKA_BOOTSTRAP_SERVERS` | Endereço do broker Kafka | `kafka:9092` |
| `OLLAMA_MODEL` | Modelo de chat | `qwen2.5:1.5b` |
| `EMBEDDING_MODEL` | Modelo de embeddings | `nomic-embed-text` |
| `TELEGRAM_BOT_TOKEN` | Token do bot (BotFather) | `changeme` |
| `AUTH_PORT` / `CHAT_PORT` / `FRONTEND_PORT` | Portas expostas | `8081` / `8082` / `3000` |

> **Nota sobre o modelo de IA:** o `qwen2.5:1.5b` foi escolhido por ser leve (~1 GB) e rodar em CPU sem travar máquinas modestas. Para mais qualidade (e mais RAM disponível), troque `OLLAMA_MODEL` por `qwen2.5:3b`, `llama3.2` ou similar e recrie o `mcp-server`.
