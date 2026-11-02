# ==========================================
# Multi-stage Dockerfile for AetherBeats
# High-performance & secure container setup
# ==========================================

# 1. Builder Stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package.json bun.lock* ./
RUN npm install

# Copy source files and build production bundle
COPY . .
RUN npm run build

# 2. Production Runner Stage (Minimal, Non-Root)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Install only production express dependency
COPY package.json ./
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force

# Copy compiled frontend and server
COPY --from=builder /app/dist ./dist

# Security: Run as unprivileged node user (non-root)
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health', (r) => { if (r.statusCode !== 200) process.exit(1); })" || exit 1

EXPOSE 3000

CMD ["node", "dist/server.js"]
