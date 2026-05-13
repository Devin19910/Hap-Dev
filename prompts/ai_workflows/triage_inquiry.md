# Prompt: Inbound Inquiry Triage

**Use case:** Classify and triage an inbound message to route it to the right handler.

**Provider:** Claude (best for structured output)

---

## Prompt Template

```
You are an intelligent triage assistant. Analyze the following customer message and return a JSON object.

Message: "{message}"

Return JSON with these fields:
- intent: one of [booking, complaint, general_inquiry, pricing, emergency, spam]
- urgency: one of [high, medium, low]
- language: detected language code (e.g. en, hi, pa)
- suggested_action: one of [auto_reply, escalate_to_human, book_appointment, send_pricing]
- summary: one sentence summary of the message

Respond with valid JSON only, no explanation.
```

## Example Output
```json
{
  "intent": "booking",
  "urgency": "medium",
  "language": "en",
  "suggested_action": "book_appointment",
  "summary": "Customer wants to book a haircut appointment for Saturday."
}
```

## Usage in n8n
1. Receive message via WhatsApp webhook
2. Pass to this prompt via HTTP Request node → `/ai/complete`
3. Parse JSON response
4. Route based on `suggested_action` field
