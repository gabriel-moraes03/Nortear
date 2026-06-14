import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel

from consumer import start_kafka_consumer
from embedder import generate_embedding, EMBEDDING_MODEL
from vector_store import upsert_user_embedding, get_user_embedding, search_similar_vagas


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_kafka_consumer()
    yield


app = FastAPI(title="Nortear Embedding Service", lifespan=lifespan)


# ─── Modelos ─────────────────────────────────────────────────────────────────

class UserEmbedRequest(BaseModel):
    userId: int
    vagaDesejada: str
    skills: list[str] = []


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.post("/embed/user", status_code=204)
def embed_user(req: UserEmbedRequest):
    """Gera embedding do perfil do usuário e persiste no pgvector."""
    texto = (
        f"Busco vaga de {req.vagaDesejada}. "
        f"Skills: {', '.join(req.skills)}."
    )
    try:
        embedding = generate_embedding(texto)
        upsert_user_embedding(req.userId, embedding)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Falha ao gerar embedding: {e}")


@app.get("/search/vagas")
def search_vagas(
    userId: int = Query(..., description="ID do usuário"),
    limit: int = Query(default=5, ge=1, le=10),
):
    """Busca semântica das vagas mais relevantes para o perfil do usuário."""
    user_emb = get_user_embedding(userId)
    if user_emb is None:
        return []

    try:
        return search_similar_vagas(user_emb, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha na busca: {e}")


@app.get("/health")
def health():
    return {"status": "ok", "embeddingModel": EMBEDDING_MODEL}
