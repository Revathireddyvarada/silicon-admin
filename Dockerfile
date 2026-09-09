# SiliconDrive admin-service - multi-stage (node:24-bookworm-slim)
# Target: <= 500 MB (bookworm-slim base alone is ~230 MB)
#
#   docker build -t admin-service .
#   docker run --rm --env-file .env.docker -p 3001:3001 admin-service
# Health: GET /api/health

FROM node:24-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY patches ./patches

RUN npm ci \
  && npm cache clean --force

COPY . .
RUN npm run build \
  && npm prune --omit=dev \
  && npm uninstall patch-package --omit=dev --no-save || true \
  && npm cache clean --force \
  && rm -rf /root/.npm /tmp/* \
  && find node_modules -type f \( \
       -name '*.md' -o -name '*.map' -o -name 'LICENSE' -o -name 'LICENSE.md' \
       -o -name 'CHANGELOG.md' -o -name 'CHANGES' -o -name '.npmignore' \
     \) -delete \
  && find node_modules -type d \( \
       -name 'test' -o -name 'tests' -o -name '__tests__' -o -name 'docs' \
       -o -name 'example' -o -name 'examples' -o -name 'coverage' \
     \) -prune -exec rm -rf {} + 2>/dev/null || true

FROM node:24-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy pruned production node_modules from builder (avoid second npm ci + cache bloat)
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main.js"]
