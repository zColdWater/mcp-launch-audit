FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY bin ./bin
COPY src ./src
RUN chmod +x ./bin/mcp-launch-audit.mjs
ENTRYPOINT ["node", "./bin/mcp-launch-audit.mjs"]
