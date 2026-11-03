FROM node:20-alpine AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:20-alpine AS server-build
RUN apk add --no-cache python3 make g++
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --verbose
COPY server/ ./
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-alpine AS runtime
RUN apk add --no-cache dumb-init && rm -rf /var/cache/apk/*

WORKDIR /app
COPY server/package*.json ./server/
COPY --from=server-build /app/server/node_modules ./server/node_modules
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=frontend-build /app/client/dist ./client/dist

RUN mkdir -p /app/data

ENV NODE_ENV=production \
    PORT=1000 \
    DB_PATH=/app/data/kanbia.db \
    JWT_SECRET=kanbia-dev-signing-key-change-in-prod \
    DEV_DEBUG_TOKEN=kanbia-dev-1000

EXPOSE 1000
WORKDIR /app/server

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/index.js"]
