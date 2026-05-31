CREATE DATABASE auth_db;
CREATE DATABASE auth_db_replica;
CREATE DATABASE vagas_db;
CREATE DATABASE vagas_db_replica;

CREATE DATABASE vector_db; 

-- 2. Conecta ESPECIFICAMENTE no banco do Chat
\c vector_db;

-- 3. Habilita a extensão vetorial APENAS dentro dele
CREATE EXTENSION IF NOT EXISTS vector;