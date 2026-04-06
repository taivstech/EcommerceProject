# ── Stage 1: Dependencies ──────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# ── Stage 2: Build ─────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars (overridden at runtime via docker-compose)
ARG VITE_API_URL=https://feeds-hull-jaguar-dreams.trycloudflare.com/api
ARG VITE_CURRENCY_SYMBOL=$
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CURRENCY_SYMBOL=$VITE_CURRENCY_SYMBOL

RUN npm run build

# ── Stage 3: Runtime (nginx for static SPA) ────────────────────
FROM nginx:alpine AS runtime

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built static files
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx config for SPA (fallback to index.html)
RUN echo 'server { \
    listen 3000; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
