CREATE DATABASE auth_db;
CREATE DATABASE auth_db_replica;
CREATE DATABASE chat_db;
CREATE DATABASE vagas_db;
CREATE DATABASE vagas_db_replica;
CREATE DATABASE vector_db;

\c vector_db;
CREATE EXTENSION IF NOT EXISTS vector;

-- Perfil vetorizado de cada usuário (gerado no cadastro via Saga)
CREATE TABLE perfil_usuario (
    user_id      BIGINT PRIMARY KEY,
    embedding    vector(768),
    atualizado_em TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX ON perfil_usuario USING hnsw (embedding vector_cosine_ops);

-- Vagas vectorizadas pelo embedding-service ao consumir vaga-processada-events
CREATE TABLE vaga_embedding (
    vaga_id     UUID PRIMARY KEY,
    titulo      VARCHAR(255),
    empresa     VARCHAR(255),
    area        VARCHAR(100),
    senioridade VARCHAR(50),
    modelo      VARCHAR(100),
    localizacao VARCHAR(255),
    skills      TEXT[],
    url         VARCHAR(512),
    embedding   vector(768),
    criado_em   TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX ON vaga_embedding USING hnsw (embedding vector_cosine_ops);

\c vagas_db;

CREATE TABLE vaga_bruta (
    id UUID PRIMARY KEY,
    titulo VARCHAR(255),
    descricao TEXT,
    empresa VARCHAR(255),
    localizacao VARCHAR(255),
    url VARCHAR(512) UNIQUE NOT NULL,
    data_coleta TIMESTAMP NOT NULL,
    processada BOOLEAN NOT NULL DEFAULT FALSE,
    modelo VARCHAR(100),
    palavra_chave VARCHAR(100)
);

CREATE TABLE skill (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE vaga_processada (
    id UUID PRIMARY KEY,
    titulo VARCHAR(255),
    empresa VARCHAR(255),
    localizacao VARCHAR(255),
    senioridade VARCHAR(50),
    modelo VARCHAR(100),
    area VARCHAR(100),
    url VARCHAR(512) UNIQUE NOT NULL
);

CREATE TABLE vaga_skill_rel (
    vaga_id UUID NOT NULL REFERENCES vaga_processada(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skill(id) ON DELETE CASCADE,
    PRIMARY KEY (vaga_id, skill_id)
);