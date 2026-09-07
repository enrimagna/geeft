#!/bin/sh
set -eu

export DATABASE_URL="${DATABASE_URL:-/data/geeft.sqlite}"
mkdir -p "$(dirname "$DATABASE_URL")"

echo "Migrating ${DATABASE_URL}"
npx drizzle-kit migrate

if [ "${SEED_ON_START:-0}" = "1" ]; then
	echo "Seeding"
	npm run db:seed
fi

exec node build/index.js
