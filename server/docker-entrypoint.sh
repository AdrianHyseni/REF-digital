#!/bin/sh
set -e

echo "Applying database migrations..."
npx prisma migrate deploy

if [ "$SEED_ON_START" = "true" ]; then
  # Only seeds if the database is empty, so restarting the container never
  # wipes out data added during a demo. Use `docker compose exec api npm
  # run seed` for an explicit, deliberate reset instead.
  npx tsx prisma/seed-if-empty.ts
fi

echo "Starting API server..."
exec node dist/index.js
