#!/bin/bash
# Test the AI Triage Workflow via the n8n webhook
# Usage: bash scripts/test_triage_workflow.sh

N8N_WEBHOOK="http://localhost:5678/webhook/ai-triage"
# n8n login: sodhi.398@gmail.com / Changeme123!
CLIENT_ID="bc6ffd63-a212-4f9e-832f-ccd4b5689f39"

echo "=========================================="
echo " AI Triage Workflow Test"
echo "=========================================="

run_test() {
  local label="$1"
  local message="$2"
  echo ""
  echo "--- Test: $label ---"
  echo "Message: $message"
  curl -s -X POST "$N8N_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "{
      \"message\": \"$message\",
      \"phone_number\": \"+1-555-0100\",
      \"client_id\": \"$CLIENT_ID\"
    }" | python3 -m json.tool 2>/dev/null || echo "(no response — is the workflow Active?)"
  echo ""
}

run_test "Booking request"      "I'd like to book an appointment for Saturday afternoon"
run_test "Pricing inquiry"      "How much does it cost for a full service package?"
run_test "Complaint"            "I am very unhappy with the service I received last week"
run_test "General question"     "What are your business hours?"
run_test "Emergency"            "I need help urgently, this is an emergency situation"
