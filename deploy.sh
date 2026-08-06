#!/bin/bash
set -e

echo "========================================"
echo "Tyme Global Password Manager - Deploy"
echo "========================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "==> Pulling latest code..."
git pull

echo ""
echo "==> Installing dependencies..."
npm install

echo ""
echo "==> Running database migrations..."
npm run migrate --workspace=backend

echo ""
echo "==> Building shared, backend, and frontend..."
npm run build --workspace=shared
npm run build --workspace=backend
npm run build --workspace=frontend

echo ""
echo "==> Restarting PasswordManager via pm2..."
pm2 restart PasswordManager

echo ""
echo "========================================"
echo "Deploy complete."
echo "========================================"
