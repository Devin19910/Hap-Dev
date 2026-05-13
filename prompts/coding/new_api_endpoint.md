# Prompt: Generate a New FastAPI Endpoint

**Use case:** Quickly scaffold a new API route following our project conventions.

---

## Prompt Template (use in Cursor / Claude Code)

```
Create a new FastAPI endpoint for the AI Automation Company backend.

Route: {HTTP_METHOD} {PATH}
Purpose: {DESCRIPTION}
Auth required: {yes/no}
DB access: {yes/no}
Request body fields: {FIELDS}
Response: {EXPECTED_RESPONSE}

Follow these conventions:
- Place the router in backend/app/api/{filename}.py
- Place business logic in backend/app/services/{service_name}.py
- Use SQLAlchemy Session via Depends(get_db)
- Use require_api_key via Depends if auth required
- Use Pydantic models for request/response
- Include error handling with HTTPException
- Follow existing patterns in backend/app/api/clients.py
```

## Example Usage
```
Create a new FastAPI endpoint for the AI Automation Company backend.

Route: POST /automations/whatsapp
Purpose: Receive a WhatsApp message and return an AI-generated reply
Auth required: yes
DB access: yes (log the message and response)
Request body fields: phone_number (str), message (str), client_id (str)
Response: { reply: str, job_id: str }
```
