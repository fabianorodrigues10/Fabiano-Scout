FROM node:22-alpine

WORKDIR /app

# Copiar package.json e pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Instalar pnpm e dependências
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copiar código
COPY . .

# Build web
RUN pnpm build:web

# Expor porta
EXPOSE 3000

# Iniciar servidor
CMD ["node", "server-simple.js"]
