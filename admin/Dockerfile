# Build context is the repo root (npm workspaces need the root lockfile).
FROM node:20-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY web/package.json web/package.json
COPY admin/package.json admin/package.json
RUN npm ci

COPY admin admin

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app/admin
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/admin/dist /usr/share/nginx/html
COPY admin/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
