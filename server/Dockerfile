# Build context is the repo root (npm workspaces need the root lockfile).
FROM node:20-alpine

WORKDIR /app

# Copy workspace manifests first so `npm ci` is cached across builds that
# only change application source.
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY web/package.json web/package.json
COPY admin/package.json admin/package.json
RUN npm ci

COPY server server
WORKDIR /app/server

RUN npx prisma generate
RUN npm run build

RUN chmod +x docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
