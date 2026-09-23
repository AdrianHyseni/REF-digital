# Build context is the repo root (npm workspaces need the root lockfile).
FROM node:20-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY web/package.json web/package.json
COPY admin/package.json admin/package.json
RUN npm ci

COPY web web

# Baked in at build time since this becomes a static site with no server-side
# env access — the browser needs an absolute URL for the API once there's no
# same-origin dev proxy.
ARG VITE_API_URL
ARG VITE_ADMIN_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ADMIN_URL=$VITE_ADMIN_URL

WORKDIR /app/web
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/web/dist /usr/share/nginx/html
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
