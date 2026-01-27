#!/bin/bash
# Pornește MongoDB (local), backend și frontend. Rulează din rădăcina proiectului.

set -e
cd "$(dirname "$0")"
ROOT="$(pwd)"

# 1. MongoDB
MONGO_DIR="$ROOT/.mongodb-local"
if [ ! -x "$MONGO_DIR/bin/mongod" ]; then
  echo "MongoDB local lipsește. Rulează întâi: ./setup-mongodb-local.sh"
  exit 1
fi
if ! pgrep -f "mongod.*27017" >/dev/null 2>&1; then
  echo "Pornesc MongoDB..."
  mkdir -p "$MONGO_DIR/data"
  "$MONGO_DIR/bin/mongod" --dbpath "$MONGO_DIR/data" --port 27017 --bind_ip localhost &
  sleep 3
fi

# 2. Backend
echo "Pornesc backend (port 8000)..."
cd "$ROOT/backend" && python3 -m uvicorn server:app --host 0.0.0.0 --port 8000 &
sleep 2

# 3. Frontend
echo "Pornesc frontend (port 3000)..."
cd "$ROOT/frontend" && DISABLE_ESLINT_PLUGIN=true npm run start

# (Frontend rulează în foreground; Ctrl+C oprește doar frontend-ul)
