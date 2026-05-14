#!/bin/bash
# Import n8n workflows via API
# Run from repo root: bash n8n_import.sh

set -e

N8N_URL="http://localhost:5678"
N8N_EMAIL="sodhi.398@gmail.com"
N8N_PASSWORD="Admin123"
COOKIE_JAR="/tmp/n8n_cookies_$$.txt"

echo ""
echo "======================================"
echo "  Nexora n8n Workflow Import"
echo "======================================"
echo ""

# Login — n8n v1+ uses session cookies, not bearer tokens
echo "Logging into n8n..."
LOGIN_RESP=$(curl -sf -X POST "${N8N_URL}/rest/login" \
  -H "Content-Type: application/json" \
  -c "${COOKIE_JAR}" \
  -d "{\"emailOrLdapLoginId\":\"${N8N_EMAIL}\",\"password\":\"${N8N_PASSWORD}\"}")

# Also try to extract API key if returned
API_KEY=$(echo "$LOGIN_RESP" | grep -o '"apiKey":"[^"]*"' | cut -d'"' -f4 || true)

# Verify cookie was set
if [ ! -s "${COOKIE_JAR}" ] && [ -z "$API_KEY" ]; then
  echo "ERROR: Login failed — no session cookie received."
  echo "Response: $LOGIN_RESP"
  echo ""
  echo "Try checking n8n is running:  docker ps | grep n8n"
  rm -f "${COOKIE_JAR}"
  exit 1
fi

echo "✓ Logged in"

WORKFLOW_DIR="$(dirname "$0")/automation/n8n"

import_workflow() {
  local FILE="$1"
  local NAME="$2"
  echo ""
  echo "Importing: $NAME"

  RESULT=$(curl -sf -X POST "${N8N_URL}/rest/workflows" \
    -H "Content-Type: application/json" \
    -b "${COOKIE_JAR}" \
    -d @"${FILE}" 2>&1) || true

  if echo "$RESULT" | grep -q '"id"'; then
    WF_ID=$(echo "$RESULT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -z "$WF_ID" ]; then
      # numeric id fallback
      WF_ID=$(echo "$RESULT" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    fi
    echo "✓ Imported (id: $WF_ID)"

    # Activate the workflow
    curl -sf -X PATCH "${N8N_URL}/rest/workflows/${WF_ID}" \
      -H "Content-Type: application/json" \
      -b "${COOKIE_JAR}" \
      -d '{"active":true}' > /dev/null && echo "✓ Activated"
  else
    echo "  Response: $RESULT"
    echo "  (may already exist — skipping)"
  fi
}

import_workflow "${WORKFLOW_DIR}/crm_new_lead_workflow.json"        "CRM New Lead"
import_workflow "${WORKFLOW_DIR}/appointment_reminder_workflow.json" "Appointment Reminder (24h)"
import_workflow "${WORKFLOW_DIR}/ai_triage_workflow.json"            "AI Triage"

rm -f "${COOKIE_JAR}"

echo ""
echo "======================================"
echo "  Import Complete"
echo "======================================"
echo ""
echo "  n8n dashboard: https://nexora-n8n.cmdfleet.com"
echo "  Login: ${N8N_EMAIL} / ${N8N_PASSWORD}"
echo ""
echo "  Verify all 3 workflows show as ACTIVE in the dashboard."
echo ""
