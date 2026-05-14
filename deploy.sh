#!/usr/bin/env bash
# deploy.sh — pull latest code and restart production services
# Run on the server: bash deploy.sh
set -euo pipefail

COMPOSE="docker compose -f docker-compose.prod.yml"
cd "$(dirname "$0")"

echo ""
echo "======================================="
echo "  Nexora — Production Deploy"
echo "======================================="

echo ""
echo "--> Pulling latest code..."
git pull origin main

echo ""
echo "--> Rebuilding backend image..."
$COMPOSE build backend

echo ""
echo "--> Restarting services (zero-downtime where possible)..."
$COMPOSE up -d --remove-orphans

echo ""
echo "--> Waiting for backend to become healthy..."
for i in $(seq 1 12); do
    if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
        echo "    Backend is up."
        break
    fi
    echo "    Waiting... ($i/12)"
    sleep 5
done

echo ""
echo "--> Service status:"
$COMPOSE ps

echo ""
echo "Deploy complete."
echo "  API:  http://localhost:8000"
echo "  Docs: http://localhost:8000/docs"
echo "  n8n:  http://localhost:5678"
echo ""
