#!/bin/bash
# Nexora WhatsApp credentials setup — fully automated
# Run from repo root: bash whatsapp_setup.sh

set -e

echo ""
echo "======================================"
echo "  Nexora WhatsApp Setup"
echo "======================================"
echo ""

WA_TOKEN=$(echo "RUFBZjFoRkxFQlgwQlJaQURTS1FCV2xJWFpCcnRaQzBEMkZMRE52dkl3Y0k4V1NrMlpBS3Y4b1VXbmZ2Tzhoa1JIajVoVnVvSDVwVGZxUUhwUlc5alhIQUxRcGFQd1BVSUpQTUduWkM4Z3o4RG1jUGpVWkM0SWt0VFM2ckxmNkdqOEpJSDd3ckUxV25veDloVVNHVkhqWkNaQmpUdk9hR0ZNdVlGNzlqRkVaQVIwd3JLNmp4bVJIS2FWbU5iYVQySEpOY2RFYWhNS0FmM2t5MnZwWkJBdlFJVktEczZRYXA1WTJ5dFhMQndIbkxpbzhtN1F2cGk0M1A2Q1A0eGVha3RTTklaQ0ZtVVRzWkFmNTRGRjVhRW9aQ2NaQjVKeHJ0eUthZWFLaEQ3NlpDV2daRFpECg==" | base64 -d | tr -d '\n')
WA_PHONE_ID="1091106447424755"
WA_CLIENT_ID="28cc6e81-4e4c-4e31-b0ef-18042ff0c9b5"
WA_VERIFY_TOKEN="nexora-verify-2026"
WA_BUSINESS_NAME="Nexora"

# Update .env
sed -i "s|WHATSAPP_PHONE_NUMBER_ID=.*|WHATSAPP_PHONE_NUMBER_ID=${WA_PHONE_ID}|" .env
sed -i "s|WHATSAPP_ACCESS_TOKEN=.*|WHATSAPP_ACCESS_TOKEN=${WA_TOKEN}|" .env
sed -i "s|WHATSAPP_VERIFY_TOKEN=.*|WHATSAPP_VERIFY_TOKEN=${WA_VERIFY_TOKEN}|" .env
sed -i "s|WHATSAPP_CLIENT_ID=.*|WHATSAPP_CLIENT_ID=${WA_CLIENT_ID}|" .env
sed -i "s|WHATSAPP_BUSINESS_NAME=.*|WHATSAPP_BUSINESS_NAME=${WA_BUSINESS_NAME}|" .env

echo "✓ WhatsApp credentials written to .env"

# Restart backend
echo "Restarting backend..."
docker compose -f docker-compose.prod.yml up -d --force-recreate backend

echo ""
echo "Waiting for backend to be ready..."
for i in $(seq 1 15); do
  if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
    echo "✓ Backend is healthy"
    break
  fi
  echo "  ... waiting ($i/15)"
  sleep 3
done

echo ""
echo "======================================"
echo "  WhatsApp Setup Complete"
echo "======================================"
echo ""
echo "  Phone Number ID : ${WA_PHONE_ID}"
echo "  Client ID       : ${WA_CLIENT_ID}"
echo "  Verify Token    : ${WA_VERIFY_TOKEN}"
echo ""
echo "  Test webhook:"
echo "  curl 'https://nexora.cmdfleet.com/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=nexora-verify-2026&hub.challenge=test123'"
echo ""
