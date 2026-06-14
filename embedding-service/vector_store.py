import os
import psycopg2
from pgvector.psycopg2 import register_vector
import numpy as np


def _get_conn():
    conn = psycopg2.connect(
        host=os.getenv("VECTOR_DB_HOST", "localhost"),
        database=os.getenv("VECTOR_DB_NAME", "vector_db"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
        port=os.getenv("POSTGRES_PORT", "5432"),
    )
    register_vector(conn)
    return conn


def upsert_user_embedding(user_id: int, embedding: list[float]) -> None:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO perfil_usuario (user_id, embedding)
            VALUES (%s, %s)
            ON CONFLICT (user_id) DO UPDATE
                SET embedding = EXCLUDED.embedding,
                    atualizado_em = now()
            """,
            (user_id, np.array(embedding)),
        )
        conn.commit()
    finally:
        conn.close()


def get_user_embedding(user_id: int) -> np.ndarray | None:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT embedding FROM perfil_usuario WHERE user_id = %s", (user_id,)
        )
        row = cur.fetchone()
        return row[0] if row else None
    finally:
        conn.close()


def upsert_vaga_embedding(
    vaga_id: str,
    titulo: str,
    empresa: str,
    area: str,
    senioridade: str,
    modelo: str,
    localizacao: str,
    skills: list[str],
    url: str,
    embedding: list[float],
) -> None:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO vaga_embedding
                (vaga_id, titulo, empresa, area, senioridade, modelo, localizacao, skills, url, embedding)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (vaga_id) DO UPDATE
                SET titulo      = EXCLUDED.titulo,
                    empresa     = EXCLUDED.empresa,
                    area        = EXCLUDED.area,
                    senioridade = EXCLUDED.senioridade,
                    modelo      = EXCLUDED.modelo,
                    localizacao = EXCLUDED.localizacao,
                    skills      = EXCLUDED.skills,
                    url         = EXCLUDED.url,
                    embedding   = EXCLUDED.embedding
            """,
            (vaga_id, titulo, empresa, area, senioridade, modelo, localizacao, skills, url, np.array(embedding)),
        )
        conn.commit()
    finally:
        conn.close()


def search_similar_vagas(query_embedding: np.ndarray, limit: int = 5) -> list[dict]:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT vaga_id, titulo, empresa, area, senioridade, modelo, localizacao, skills, url,
                   1 - (embedding <=> %s) AS similarity
            FROM vaga_embedding
            ORDER BY embedding <=> %s
            LIMIT %s
            """,
            (query_embedding, query_embedding, limit),
        )
        rows = cur.fetchall()
        return [
            {
                "vagaId": str(r[0]),
                "titulo": r[1],
                "empresa": r[2],
                "area": r[3],
                "senioridade": r[4],
                "modelo": r[5],
                "localizacao": r[6],
                "skills": r[7] or [],
                "url": r[8],
                "similarity": round(float(r[9]), 4),
            }
            for r in rows
        ]
    finally:
        conn.close()
