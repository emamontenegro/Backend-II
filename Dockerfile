# ============================================================
# Dockerfile multi-stage
#
# Stage "development" → usado por docker-compose.dev.yml
#   - Instala TODO (incluyendo devDependencies como nodemon)
#   - Corre con nodemon para live-reload
#
# Stage "production"  → imagen final optimizada
#   - Solo dependencias de producción (--omit=dev)
#   - Sin código de desarrollo ni herramientas de debug
#
# Build de producción: docker build -t mi-imagen:latest .
# Build de desarrollo: docker build --target development -t mi-imagen:dev .
# ============================================================

# ── Stage base compartido ───────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./

# ── Stage: development ──────────────────────────────────────
FROM base AS development
# Instala TODAS las dependencias (incluyendo pino-pretty, etc.)
RUN npm install
COPY src ./src
ENV NODE_ENV=development
ENV PORT=3000
EXPOSE 3000
# --watch es el live-reload nativo de Node.js 18+ (sin dependencias extra)
CMD ["node", "--watch", "src/app.js"]

# ── Stage: production ───────────────────────────────────────
FROM base AS production
# Solo dependencias de producción → imagen más pequeña y segura
RUN npm ci --omit=dev
COPY src ./src
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:8080/ || exit 1
CMD ["node", "src/app.js"]
