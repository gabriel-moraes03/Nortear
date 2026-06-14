# Documento de Arquitetura de Software — Projeto Nortear (Versão 2)

Este documento apresenta a especificação técnica atualizada do ecossistema **Nortear**. Esta revisão consolida a topologia exata dos diagramas estruturais do projeto, alinhando-os diretamente com o infográfico de referência de padrões de microsserviços (API Gateway, Database per Service, CQRS e Saga Coreografada) e integrando as evoluções tecnológicas discutidas: a transição para uma **LLM Local (Ollama)** e a estratégia omnichannel com o **Telegram**.

---

## 1. Alinhamento com Padrões e Princípios de Microsserviços

Com base nos padrões de engenharia de software de alta escalabilidade, o sistema Nortear foi desenhado sob os seguintes pilares:

* **Database per Service (Banco por Serviço):** Total isolamento de dados. O domínio de identidade (`Auth MS`) possui sua própria base de dados, completamente segregada do domínio de vagas e inteligência artificial (`Chat MS` e `Pipeline de Ingestão`). A comunicação inter-serviços é estritamente orientada a eventos ou APIs, eliminando acoplamento a nível de persistência.
* **API Gateway Routing:** O `Spring Cloud Gateway` atua como a borda única do sistema, encarregado de encapsular a estrutura interna de microsserviços, gerenciar a segurança (SSL/Autenticação) e aplicar políticas de *Rate Limiting*.
* **CQRS (Command Query Responsibility Segregation):** Separação clara entre o fluxo de escrita de alto volume (ingestão de vagas) e o fluxo de leitura de baixa latência (interação conversacional do usuário).
* **Saga Pattern (Coreografada):** Manutenção da consistência eventual entre microsserviços sem transações globais bloqueantes (Two-Phase Commit), utilizando o Apache Kafka como barramento de coreografia para fluxos normais e de compensação.

---

## 2. Visão Detalhada da Topologia Atualizada

A arquitetura do Nortear está dividida em três grandes ecossistemas conectados de forma resiliente:

```
                  [ FRONTEND ] (React + TypeScript)
                       │
                       ▼
           [ API GATEWAY ] (Spring Cloud)
            ───┬───────────────────────┬───
               │                       │
               ▼                       ▼
      ┌─────────────────┐     ┌───────────────────────────────────────────────────┐
      │     AUTH MS     │     │                      CHAT MS                      │
      │  (Spring Boot)  │     │ ┌──────────────────┐     ┌──────────────────────┐ │
      └────────┬────────┘     │ │   CHAT SERVICE   │◄───►│      MCP SERVER      │ │
               │              │ │  (Spring Boot)   │     │       (Python)       │ │
        [AuthDB Princ.]       │ └──────────────────┘     └───────┬──┬───┬──────┘ │
               │              └──────────────────────────────────┼──┼───┼─────────┘
         (Replicação)                                            │  │   │
               ▼                                                 │  │   │
        [AuthDB Réplica]◄────────────────────────────────────────┘  │   │
                                                                    │   │
  ┌──────────────────────────────────────────────────────────────┐  │   │
  │               PIPELINE DE INGESTÃO (ASSÍNCRONO)              │  │   │
  │                                                              │  │   │
  │  [ SCRAPER ] ──► [ APACHE KAFKA ] ──► [ ETL SERVICE ]        │  │   │
  │   (Python)                             (Python)              │  │   │
  │                                           │                  │  │   │
  │                                           ▼                  │  │   │
  │   ┌─────────────────┐              ┌──────────────┐          │  │   │
  │   │ VagasDB Princ.  │◄─────────────┤   VectorDB   ├──────────┼──┘   │
  │   └────────┬────────┘              │  (pgvector)  │          │      │
  │            │                       └──────────────┘          │      │
  │      (Replicação)                                            │      │
  │            ▼                                                 │      │
  │   │ VagasDB Réplica │◄───────────────────────────────────────┴──────┘
  └───┴─────────────────┴────────────────────────────────────────┘
                                       │
                                       ▼
                                [ OLLAMA LLM ] (Local)
```

### 2.1 Clientes e Camada de Acesso (Borda)
* **Frontend:** Aplicação única desenvolvida em **React + TypeScript**, responsável por fornecer uma interface de chat fluida, ágil e responsiva.
* **API Gateway (Spring Cloud):** Porta de entrada que intercepta todas as requisições HTTP do Frontend. Ele autentica os tokens no `Auth MS` e encaminha as requisições de negócio para o `Chat MS`.

### 2.2 Microsserviço de Autenticação (Auth MS)
* **Componente:** Desenvolvido em **Java com Spring Boot**.
* **Persistência Segregada (Read/Write Splitting):**
    * **AuthDB Principal (PostgreSQL):** Recebe as operações de escrita (comandos de criação de conta, alteração de senhas, atualizações de perfil).
    * **AuthDB Réplica (PostgreSQL):** Alimentado via replicação assíncrona a partir do banco principal. É exposto para consultas rápidas de leitura e validação, inclusive com acesso de leitura concedido ao `MCP Server` para enriquecimento de contexto.

### 2.3 Microsserviço de Chat e Camada de Inteligência (Chat MS)
O `Chat MS` foi projetado como um componente híbrido de alta performance, contendo dois submódulos operando lado a lado:
* **Chat Service (Java / Spring Boot):** Gerencia as sessões WebSocket/HTTP de conversação, validação de regras de negócio clássicas e persistência do histórico transacional de mensagens.
* **MCP Server (Python):** O núcleo inteligente baseado no *Model Context Protocol*. Ele atua como o **Host/Client** do protocolo, interagindo localmente com os dados e orquestrando a inteligência artificial. Suas conexões diretas incluem:
    * Acesso ao **VectorDB (pgvector)** para recuperação semântica de vagas (RAG).
    * Acesso ao **VagasDB Réplica** para consultas relacionais e estruturadas sobre vagas.
    * Acesso ao **AuthDB Réplica** para ler preferências e dados de perfil do usuário sob demanda.
* **Provedor de IA (Ollama Local):** Substituindo totalmente as requisições externas para APIs de terceiros, o MCP Server conecta-se a uma instância local do **Ollama** executando modelos otimizados de linguagem (ex: *Llama 3* / *Mistral*).

### 2.4 Pipeline de Ingestão de Vagas (Assíncrono & CQRS)
Este ecossistema isolado garante o fluxo contínuo de dados sem onerar o processamento das conversas em tempo real:
* **Scraper (Python):** Coleta dados brutos de vagas de plataformas de emprego e os publica imediatamente como eventos brutos no **Apache Kafka**.
* **Apache Kafka:** Garante resiliência, retenção temporária e entrega confiável das mensagens, absorvendo picos de carga do scraper.
* **ETL Service (Python):** Consome os dados brutos do Kafka, realiza a higienização, estruturação e aciona modelos de embedding. Suas saídas são enviadas para:
    * **VagasDB Principal (PostgreSQL):** Onde os dados relacionais puros da vaga são gravados (e posteriormente replicados para o **VagasDB Réplica**).
    * **VectorDB (PostgreSQL + pgvector):** Onde os vetores (embeddings) de alta dimensionalidade das descrições das vagas são armazenados para buscas de similaridade cosseno.

---

## 3. Implementação Prática dos Novos Fluxos Dinâmicos

### 3.1 Padrão CQRS no Domínio de Vagas
O desenho do pipeline de vagas é um exemplo purista de CQRS:
* **Fluxo de Comando (Escrita):** `Scraper` $
ightarrow$ `Kafka` $
ightarrow$ `ETL Service` $
ightarrow$ `VagasDB Principal` / `VectorDB`. Focado em taxa de transferência massiva, processamento em lote e consistência eventual de leitura.
* **Fluxo de Consulta (Leitura/RAG):** `Chat Service` $
ightarrow$ `MCP Server` $
ightarrow$ Execução de busca semântica no `VectorDB` + Busca complementar no `VagasDB Réplica` $
ightarrow$ Contextualização no `Ollama` $
ightarrow$ Resposta ao Usuário. Otimizado para latência ultra-baixa e queries complexas de busca aproximada (KNN/HNSW).

### 3.2 Saga Coreografada para Cadastro Baseada no Infográfico de Referência
Para garantir que o perfil de IA do usuário seja criado no banco vetorial sem criar dependência síncrona entre o `Auth MS` e o `Chat MS`, adota-se a coreografia via Kafka:

```
[Auth MS] ──► Grava AuthDB (PENDING) ──► Publica: UserCreatedEvent ──┐
                                                                     ▼
[Auth MS] ◄── Altera para (ACTIVE) ◄── Consome Sucesso ◄───── [Kafka Tópicos]
                                                                     ▲
[Auth MS] ◄── Remove Conta (Rollback) ◄── Consome Falha ◄────────────┤
                                                                     │
[MCP Server] ◄── Consome Evento ──► Roda Ollama/VectorDB ────────────┘
                 (Se falhar, dispara evento de compensação)
```

1.  **Fluxo Normal (Sucesso):**
    * O `Auth MS` cria o usuário no `AuthDB Principal` com status `PENDING_CONFIRMATION` e publica `UserCreatedEvent`.
    * O `MCP Server` captura o evento, invoca o `Ollama` para processar o perfil profissional inicial e salva as preferências vetorizadas no `VectorDB`.
    * O `Chat MS` publica `UserProfileCreatedEvent` com status `SUCCESS`.
    * O `Auth MS` consome o evento e atualiza o status do usuário para `ACTIVE`.
2.  **Fluxo de Compensação (Falha):**
    * Caso ocorra um estouro de memória no `Ollama` ou o `VectorDB` fique indisponível durante o processamento do perfil, o `Chat MS` captura a exceção e publica o `UserProfileCreatedEvent` com status `FAILED`.
    * O `Auth MS` consome o evento de falha e executa a **ação compensatória**: remove o registro do usuário do `AuthDB Principal` ou marca como `REGISTRATION_FAILED`, notificando o cliente para tentar novamente.

### 3.3 Integração Omnichannel com o Telegram via MCP
A arquitetura suporta o Telegram de forma nativa e integrada através de dois comportamentos assimétricos:

* **Entrada de Mensagens (Inbound - IA Conversacional):**
    1.  O usuário envia uma mensagem para o Bot do Telegram.
    2.  A API do Telegram dispara um *Webhook* direcionado ao `API Gateway`, que o repassa para o `Chat Service`.
    3.  O `Chat Service` traduz o `chat_id` do Telegram no `userId` interno (usando a tabela de mapeamento sincronizada via réplica do banco) e repassa para o fluxo padrão do `MCP Server` + `Ollama`.
* **Saída de Notificações (Outbound - Alerta de Vagas Activo):**
    1.  O pipeline de ingestão identifica uma vaga com alta aderência ao perfil de um usuário.
    2.  O `MCP Server`, utilizando as capacidades nativas do protocolo MCP, expõe uma **Tool** chamada `enviar_notificacao_telegram`.
    3.  A LLM (Ollama), ao analisar o match, decide invocar esta ferramenta, enviando uma requisição HTTP direta para a API do Telegram, que entrega o alerta formatado em Markdown no smartphone do usuário.

---

## 4. Estratégia de Deploy e Infraestrutura de Concorrência

* **Separação de Instâncias de Banco:** As réplicas do `AuthDB` e `VagasDB` reduzem drasticamente a contenção de locks de banco. Queries analíticas de IA e RAG nunca concorrem com inserts do pipeline ou updates de credenciais.
* **Isolamento de CPU/GPU:** Como a LLM (Ollama) roda localmente, ela é configurada em um container isolado com restrição de recursos (ou alocação dedicada de GPU), garantindo que picos de requisições de chat não causem starvation de CPU nos microsserviços Spring Boot ou nos scripts Python de ETL.