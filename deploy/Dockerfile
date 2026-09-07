# =============================================================================
# Dockerfile — Bécquer Quiz Interattivo (QUIZ INTERATTIVO CON AUDIO SORGENTE)
# Build multi-stage: compila client (Vite) + server (esbuild) e produce
# un'immagine runtime minima. Usato da render.yaml (Blueprint) e da
# docker-compose. Funziona da una repository GitHub PULITA (senza dist/).
#
# Build:   docker build -t becquer-quiz .
# Run:     docker run --rm -p 3000:3000 -e DATABASE_URL=... -e BETTER_AUTH_SECRET=... becquer-quiz
# =============================================================================

# ---------- Stage 1: build ----------
FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable pnpm

# Dipendenze (intere: servono devDeps per buildare)
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --no-frozen-lockfile

# Sorgenti
COPY . .

# Build di produzione: dist/index.js (server) + dist/public (client)
RUN pnpm build

# ---------- Stage 2: runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app

RUN corepack enable pnpm && \
  node -e "const p=require('./package.json'); delete p.pnpm?.patchedDependencies; require('fs').writeFileSync('./package.json', JSON.stringify(p, null, 2));"

# Solo dipendenze di produzione (esclude devDeps: niente sorgenti/build)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --no-frozen-lockfile
# drizzle-kit serve all'entrypoint per le migrazioni automatiche (drizzle-kit push)
RUN pnpm add -D drizzle-kit@^0.31.4 --no-frozen-lockfile

# Artefatti di runtime
COPY --from=build /app/dist ./dist
# Per le migrazioni automatiche all'avvio (drizzle-kit push)
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts

# Entrypoint: esegue le migrazioni del DB e poi avvia il server
COPY deploy/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
