import express from "express";
import { Ollama } from "ollama";

const app = express();
app.use(express.json());

const ollama = new Ollama({
  host: process.env.OLLAMA_URL || "http://localhost:11434",
});

const MODEL = process.env.OLLAMA_MODEL || "llama3.2";
const EMBEDDING_SERVICE_URL = process.env.EMBEDDING_SERVICE_URL || "http://localhost:8001";

const SYSTEM_PROMPT = `Você é o Nortear, um assistente de carreira especializado em orientação profissional no mercado brasileiro.
Seu objetivo é ajudar os usuários a encontrar vagas, preparar currículos, treinar para entrevistas e planejar sua evolução de carreira.
Seja direto, empático e prático nas respostas. Responda sempre em português.`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchVagasRelevantes(userId) {
  try {
    const res = await fetch(
      `${EMBEDDING_SERVICE_URL}/search/vagas?userId=${userId}&limit=5`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    const vagas = await res.json();
    return vagas;
  } catch (e) {
    console.warn(`[RAG] Busca semântica indisponível para userId=${userId}:`, e.message);
    return [];
  }
}

function buildVagasContext(vagas) {
  if (!vagas || vagas.length === 0) return "";

  const linhas = vagas.map((v) => {
    const skills = Array.isArray(v.skills) ? v.skills.join(", ") : "";
    return `• ${v.titulo} — ${v.empresa} | ${v.senioridade || "?"} | ${v.modelo || ""} | Skills: ${skills} | ${v.url}`;
  });

  return (
    "\n\n---\nVAGAS RELEVANTES ENCONTRADAS (baseadas no perfil do usuário — use para embasar suas respostas):\n" +
    linhas.join("\n") +
    "\n---"
  );
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

// Chamado pelo chat-service para cada mensagem do usuário
app.post("/mcp/prompt", async (req, res) => {
  const { userId, sessionId, message, history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Campo 'message' é obrigatório." });
  }

  // 1. Busca semântica das vagas mais relevantes para o perfil do usuário (RAG)
  const vagasRelevantes = await fetchVagasRelevantes(userId);
  const vagasContext = buildVagasContext(vagasRelevantes);

  if (vagasRelevantes.length > 0) {
    console.log(`[RAG] ${vagasRelevantes.length} vagas injetadas no contexto para userId=${userId}`);
  }

  // 2. Monta o array de mensagens com contexto RAG no system prompt
  const messages = [
    { role: "system", content: SYSTEM_PROMPT + vagasContext },
    ...history.map((h) => ({
      role: h.sender === "USER" ? "user" : "assistant",
      content: h.content,
    })),
    { role: "user", content: message },
  ];

  // 3. Chama o modelo local
  try {
    const ollamaResponse = await ollama.chat({ model: MODEL, messages, stream: false });
    const aiText = ollamaResponse.message.content;
    console.log(`[prompt] userId=${userId} sessionId=${sessionId} → ${aiText.slice(0, 80)}...`);
    return res.json({ response: aiText });
  } catch (err) {
    console.error("[prompt] Erro ao chamar Ollama:", err.message);
    return res.status(502).json({ error: "Falha ao obter resposta do modelo local." });
  }
});

// Chamado pela Saga de cadastro (UserRegistrationConsumer no chat-service)
app.post("/mcp/user/init", async (req, res) => {
  const { userId, vagaDesejada, skills = [] } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Campo 'userId' é obrigatório." });
  }

  console.log(`[user/init] Inicializando perfil userId=${userId}, vaga="${vagaDesejada}", skills=${skills.join(", ")}`);

  // Delega a geração e persistência do embedding ao embedding-service
  try {
    const embRes = await fetch(`${EMBEDDING_SERVICE_URL}/embed/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, vagaDesejada, skills }),
      signal: AbortSignal.timeout(15000),
    });

    if (!embRes.ok) {
      const body = await embRes.text();
      console.error(`[user/init] embedding-service retornou ${embRes.status}: ${body}`);
    } else {
      console.log(`[user/init] Embedding gerado com sucesso para userId=${userId}`);
    }
  } catch (e) {
    // Não bloqueia a Saga — o perfil pode ser re-vectorizado depois
    console.error(`[user/init] Falha ao contatar embedding-service:`, e.message);
  }

  return res.status(204).send();
});

// Health check
app.get("/health", (_req, res) =>
  res.json({ status: "ok", model: MODEL, embeddingService: EMBEDDING_SERVICE_URL })
);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(
    `MCP Server rodando na porta ${PORT} | Ollama: ${process.env.OLLAMA_URL || "http://localhost:11434"} | Modelo: ${MODEL} | Embedding: ${EMBEDDING_SERVICE_URL}`
  );
});
