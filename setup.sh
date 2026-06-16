#!/usr/bin/env bash
# ============================================================
#  OptiFlow - Mac / Linux setup.
#  Usage:  bash setup.sh
# ============================================================
set -euo pipefail
cd "$(dirname "$0")"

echo ""
echo "=== OptiFlow setup (Mac/Linux) ==="
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js is not installed. Get Node 20+ from https://nodejs.org"
  exit 1
fi

echo "Node version: $(node --version)"
echo ""

# Remove dependencies / cache built for another machine.
[ -d node_modules ] && { echo "Removing old node_modules..."; rm -rf node_modules; }
[ -d .next ] && { echo "Removing old .next cache..."; rm -rf .next; }

echo "Installing dependencies..."
npm install

if [ ! -f .env.local ]; then
  echo "[WARNING] .env.local not found. Copying from .env.example."
  cp .env.example .env.local
  echo "Edit .env.local and fill in MONGODB_URI, JWT_SECRET, etc."
fi

echo ""
echo "=== Setup complete ==="
echo "Start the app with:   npm run dev"
echo "Then open:            http://localhost:3000"
