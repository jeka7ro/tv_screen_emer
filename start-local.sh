#!/bin/bash
# Pornește backend + frontend (Supabase). Setează DATABASE_URL în backend/.env.

set -e
cd "$(dirname "$0")"
ROOT="$(pwd)"

echo "Pornesc backend (port 8000)..."
(cd "$ROOT/backend" && python3 -m uvicorn server:app --host 0.0.0.0 --port 8000) &
sleep 2

echo "Pornesc frontend (port 3000)..."
(cd "$ROOT/frontend" && DISABLE_ESLINT_PLUGIN=true npm run start)
