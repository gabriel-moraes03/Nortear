import json
import os
import threading
import time

from kafka import KafkaConsumer

from embedder import generate_embedding
from vector_store import upsert_vaga_embedding

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
TOPIC = "vaga-processada-events"
GROUP_ID = "embedding-service-group"


def start_kafka_consumer() -> None:
    thread = threading.Thread(target=_run_consumer, daemon=True, name="kafka-consumer")
    thread.start()
    print(f"[Kafka] Thread consumer iniciada — topic={TOPIC}")


def _run_consumer() -> None:
    while True:
        try:
            consumer = KafkaConsumer(
                TOPIC,
                bootstrap_servers=KAFKA_BOOTSTRAP,
                group_id=GROUP_ID,
                value_deserializer=lambda m: json.loads(m.decode("utf-8")),
                auto_offset_reset="earliest",
                enable_auto_commit=True,
                consumer_timeout_ms=-1,
            )
            print("[Kafka] Consumer conectado, aguardando eventos de vagas...")
            for msg in consumer:
                _handle_event(msg.value)
        except Exception as e:
            print(f"[Kafka] Erro de conexão: {e}. Reconectando em 10s...")
            time.sleep(10)


def _handle_event(event: dict) -> None:
    vaga_id = event.get("vagaId", "")
    titulo = event.get("titulo", "")
    descricao = event.get("descricao", "")
    empresa = event.get("empresa", "")
    area = event.get("area", "")
    senioridade = event.get("senioridade", "")
    modelo = event.get("modelo", "")
    localizacao = event.get("localizacao", "")
    skills = event.get("skills", [])
    url = event.get("url", "")

    # Texto rico para embedding: dá peso a título, skills e área
    texto = (
        f"{titulo}. "
        f"Área: {area}. "
        f"Senioridade: {senioridade}. "
        f"Skills: {', '.join(skills)}. "
        f"{descricao[:600]}"
    )

    try:
        embedding = generate_embedding(texto)
        upsert_vaga_embedding(
            vaga_id, titulo, empresa, area, senioridade, modelo,
            localizacao, skills, url, embedding
        )
        print(f"[Kafka] Vaga vectorizada: {titulo[:50]} ({vaga_id})")
    except Exception as e:
        print(f"[Kafka] Falha ao vectorizar vaga {vaga_id}: {e}")
