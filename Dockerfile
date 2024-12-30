FROM node:22-alpine3.20 AS builder

WORKDIR /app

COPY src ./src
COPY [ \
  ".eslintrc.js", \
  ".swcrc", \
  "package.json", \
  "package-lock.json", \
  "./" \
]

RUN npm ci
RUN npm run build
RUN npm run bundle

# ----------------------------

FROM node:22-alpine3.20

LABEL org.opencontainers.image.title="Songbook Server"
LABEL org.opencontainers.image.authors="Marek Sierociński"
LABEL org.opencontainers.image.source="https://github.com/abybylijedno/songbook-server"
LABEL org.opencontainers.image.licenses="GPL-3.0"

ENV NODE_ENV=production

WORKDIR /app
COPY --from=builder /app/dist/build/index.js /app/server.js
RUN chown -R node:node /app

USER node
CMD [ "node", "server.js" ]
