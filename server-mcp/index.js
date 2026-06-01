import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const app = express();
let transport;

// Rota onde o cliente (ou outros serviços) inicia a conexão SSE
app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
  console.log("Cliente MCP conectado via SSE!");
});

// Rota por onde o cliente envia mensagens/comandos para a IA
app.post("/messages", async (req, res) => {
  if (transport) {
    await transport.handleMessage(req, res);
  } else {
    res.status(400).send("Nenhuma conexão SSE ativa.");
  }
});

// Porta onde o container vai rodar
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor MCP HTTP rodando na porta ${PORT}`);
});