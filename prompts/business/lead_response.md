# Prompt: AI Lead Response

**Use case:** Automatically respond to a new inbound lead with a personalized, professional message.

**Provider:** Claude or OpenAI  
**Variables:** `{business_name}`, `{lead_name}`, `{service_interest}`, `{language}`

---

## Prompt Template

```
You are a helpful assistant for {business_name}.

A new lead named {lead_name} has inquired about: {service_interest}.

Write a warm, professional, concise response message in {language} that:
1. Thanks them for reaching out
2. Confirms what they're interested in
3. Proposes a next step (call, booking, or demo)
4. Sounds human, not robotic

Keep it under 100 words.
```

## Example Output (English)
> Hi Sarah! Thanks so much for reaching out to Bright Smile Dental. We'd love to help you with your teeth whitening inquiry. Our team has a few slots available this week — would you like to book a free 15-minute consultation? Reply YES and we'll send you a booking link right away!

## Usage in Code
```python
from app.services.ai_router import run

response = await run(
    prompt=lead_response_prompt.format(
        business_name="Bright Smile Dental",
        lead_name="Sarah",
        service_interest="teeth whitening",
        language="English"
    ),
    provider="claude"
)
```
