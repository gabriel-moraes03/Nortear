# Usa uma imagem oficial leve do Node.js
FROM node:18-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de configuração de dependências
COPY package*.json ./

# Instala as dependências de produção
RUN npm install --only=production

# Copia o resto do código do servidor
COPY index.js ./

# Expõe a porta que o servidor MCP HTTP está usando
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "index.js"]