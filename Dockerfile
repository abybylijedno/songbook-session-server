FROM node:22-alpine3.22 AS builder

WORKDIR /app

COPY src ./src
COPY ["package.json", "package-lock.json", "./"]

RUN npm ci
RUN npm run build

# ----------------------------

FROM node:22-alpine3.22

ARG VERSION=0.0.0

LABEL org.opencontainers.image.title="Songbook Server"
LABEL org.opencontainers.image.authors="Marek Sierociński"
LABEL org.opencontainers.image.source="https://github.com/abybylijedno/songbook-session-server"
LABEL org.opencontainers.image.licenses="GPL-3.0"
LABEL org.opencontainers.image.version="${VERSION}"

ENV NODE_ENV=production

WORKDIR /app
COPY --from=builder /app/dist/server.js /app/server.js
RUN chown -R node:node /app

USER node
CMD [ "node", "server.js" ]
