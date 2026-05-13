# Prompt: Appointment Confirmation Message

**Use case:** Send a confirmation message after a booking is made.

**Provider:** Claude or OpenAI  
**Variables:** `{client_name}`, `{business_name}`, `{service}`, `{date}`, `{time}`, `{address}`

---

## Prompt Template

```
Write a friendly appointment confirmation message for:
- Client: {client_name}
- Business: {business_name}
- Service: {service}
- Date: {date}
- Time: {time}
- Location: {address}

Include:
1. Confirmation of appointment details
2. What to bring or prepare (if applicable)
3. Cancellation/rescheduling note
4. A warm, professional tone

Keep under 120 words.
```
