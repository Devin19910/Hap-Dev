#!/bin/bash
# Quick-start setup for local development on WSL/Linux

set -e

echo "==> Copying .env.example to .env"
cp -n .env.example .env || echo ".env already exists, skipping"

echo "==> Installing backend dependencies"
cd backend
pip install -r requirements.txt
cd ..

echo "==> Installing frontend dependencies"
cd frontend
npm install
cd ..

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Fill in your API keys in .env"
echo "  2. Start everything: cd docker && docker compose up --build"
echo "  3. Backend API docs: http://localhost:8000/docs"
echo "  4. Frontend dev: cd frontend && npm run dev  -> http://localhost:3000"
