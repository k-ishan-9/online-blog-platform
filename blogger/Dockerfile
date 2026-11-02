# ---- Stage 1: build the React app ----
FROM node:22-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: the production image (API + built frontend, no dev tools) ----
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./backend/
COPY --from=frontend /app/frontend/dist ./frontend/dist

# Run as the unprivileged "node" user, not root
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s \
  CMD node -e "fetch('http://localhost:5000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "backend/server.js"]
