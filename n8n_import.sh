#!/bin/bash
# Import n8n workflows via API
# Run from repo root: bash n8n_import.sh

set -e

N8N_URL="http://localhost:5678"
N8N_EMAIL="sodhi.398@gmail.com"
N8N_PASSWORD="Admin123"

echo ""
echo "======================================"
echo "  Nexora n8n Workflow Import"
echo "======================================"
echo ""

# Get auth token
echo "Logging into n8n..."
TOKEN=$(curl -sf -X POST "${N8N_URL}/rest/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${N8N_EMAIL}\",\"password\":\"${N8N_PASSWORD}\"}" \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "ERROR: Could not get auth token. Check credentials."
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
    -H "Cookie: n8n-auth=${TOKEN}" \
    -d @"${FILE}" 2>&1) || true

  if echo "$RESULT" | grep -q '"id"'; then
    WF_ID=$(echo "$RESULT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "✓ Imported (id: $WF_ID)"

    # Activate the workflow
    curl -sf -X PATCH "${N8N_URL}/rest/workflows/${WF_ID}" \
      -H "Content-Type: application/json" \
      -H "Cookie: n8n-auth=${TOKEN}" \
      -d '{"active":true}' > /dev/null && echo "✓ Activated"
  else
    echo "  Response: $RESULT"
    echo "  (may already exist — skipping)"
  fi
}

import_workflow "${WORKFLOW_DIR}/crm_new_lead_workflow.json"       "CRM New Lead"
import_workflow "${WORKFLOW_DIR}/appointment_reminder_workflow.json" "Appointment Reminder (24h)"
import_workflow "${WORKFLOW_DIR}/ai_triage_workflow.json"           "AI Triage"

echo ""
echo "======================================"
echo "  Import Complete"
echo "======================================"
echo ""
echo "  n8n dashboard: https://nexora-n8n.cmdfleet.com"
echo "  Login: ${N8N_EMAIL}"
echo ""
echo "  Verify all 3 workflows show as ACTIVE in the dashboard."
echo ""
