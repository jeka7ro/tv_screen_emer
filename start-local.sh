#!/bin/bash
# Pornește backend + frontend (Supabase). Setează DATABASE_URL în backend/.env.

set -e
cd "$(dirname "$0")"
ROOT="$(pwd)"

BACKEND_PORT=${BACKEND_PORT:-8002}
FRONTEND_PORT=${FRONTEND_PORT:-3004}

echo "Pornesc backend (port $BACKEND_PORT)..."
(cd "$ROOT/backend" && python3 -m uvicorn server:app --host 0.0.0.0 --port $BACKEND_PORT) &
sleep 2

echo "Pornesc frontend (port $FRONTEND_PORT)..."
(cd "$ROOT/frontend" && PORT=$FRONTEND_PORT DISABLE_ESLINT_PLUGIN=true npm run start)
