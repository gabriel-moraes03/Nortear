"""
Backfill de embeddings: vetoriza vagas processadas que ainda não têm embedding.

Lê direto do Postgres (vagas_db) as vagas que faltam em vaga_embedding (vector_db),
gera o embedding via Ollama e grava — sem depender do replay do Kafka.

Uso:  docker exec nortear-embedding python backfill_embeddings.py
"""
import os
import psycopg2

from embedder import generate_embedding
from vector_store import upsert_vaga_embedding


def _vagas_conn():
    return psycopg2.connect(
        host=os.getenv("VECTOR_DB_HOST", "postgres-db"),
        database="vagas_db",
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
        port=os.getenv("POSTGRES_PORT", "5432"),
    )


def _vector_conn():
    return psycopg2.connect(
        host=os.getenv("VECTOR_DB_HOST", "postgres-db"),
        database=os.getenv("VECTOR_DB_NAME", "vector_db"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
        port=os.getenv("POSTGRES_PORT", "5432"),
    )


def main():
    # IDs que já possuem embedding
    vconn = _vector_conn()
    vcur = vconn.cursor()
    vcur.execute("SELECT vaga_id::text FROM vaga_embedding")
    existentes = {r[0] for r in vcur.fetchall()}
    vconn.close()
    print(f"[backfill] {len(existentes)} embeddings já existentes")

    # Vagas processadas + skills + descrição (da vaga_bruta, casada por url)
    conn = _vagas_conn()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT vp.id::text, vp.titulo, vp.empresa, vp.area, vp.senioridade,
               vp.modelo, vp.localizacao, vp.url,
               COALESCE(vb.descricao, ''),
               COALESCE(array_agg(s.nome) FILTER (WHERE s.nome IS NOT NULL), '{}')
        FROM vaga_processada vp
        LEFT JOIN vaga_bruta vb       ON vb.url = vp.url
        LEFT JOIN vaga_skill_rel vsr  ON vsr.vaga_id = vp.id
        LEFT JOIN skill s             ON s.id = vsr.skill_id
        GROUP BY vp.id, vp.titulo, vp.empresa, vp.area, vp.senioridade,
                 vp.modelo, vp.localizacao, vp.url, vb.descricao
        """
    )
    vagas = cur.fetchall()
    conn.close()

    faltando = [v for v in vagas if v[0] not in existentes]
    print(f"[backfill] {len(vagas)} vagas no total, {len(faltando)} faltando embedding")

    ok, erro = 0, 0
    for i, v in enumerate(faltando, 1):
        (vaga_id, titulo, empresa, area, senioridade, modelo,
         localizacao, url, descricao, skills) = v
        texto = (
            f"{titulo}. Área: {area}. Senioridade: {senioridade}. "
            f"Skills: {', '.join(skills)}. {descricao[:600]}"
        )
        try:
            emb = generate_embedding(texto)
            upsert_vaga_embedding(
                vaga_id, titulo, empresa, area, senioridade, modelo,
                localizacao, list(skills), url, emb,
            )
            ok += 1
            if i % 25 == 0:
                print(f"[backfill] {i}/{len(faltando)} processadas...")
        except Exception as e:
            erro += 1
            print(f"[backfill] ERRO em {titulo[:40]}: {e}")

    print(f"[backfill] CONCLUÍDO — {ok} vetorizadas, {erro} erros")


if __name__ == "__main__":
    main()
