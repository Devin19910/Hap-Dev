#!/bin/bash
# Debug n8n login — shows raw response
# Run: bash n8n_debug.sh

echo "=== Is n8n running? ==="
docker ps | grep n8n || echo "WARNING: n8n container not found"

echo ""
echo "=== Can we reach n8n on localhost:5678? ==="
curl -sv http://localhost:5678/healthz 2>&1 | tail -5 || true

echo ""
echo "=== Raw login response ==="
curl -v -X POST "http://localhost:5678/rest/login" \
  -H "Content-Type: application/json" \
  -c /tmp/n8n_test_cookie.txt \
  -d '{"email":"sodhi.398@gmail.com","password":"Admin123"}' \
  2>&1

echo ""
echo "=== Cookie file contents ==="
cat /tmp/n8n_test_cookie.txt 2>/dev/null || echo "(no cookie file)"
rm -f /tmp/n8n_test_cookie.txt
