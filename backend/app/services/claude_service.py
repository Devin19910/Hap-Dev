import anthropic
from ..utils.config import settings

client = anthropic.AsyncAnthropic(api_key=settings.claude_api_key)


async def complete(prompt: str, model: str = "claude-sonnet-4-6", system: str = "") -> dict:
    response = await client.messages.create(
        model=model,
        max_tokens=1024,
        system=system or "You are a helpful AI automation assistant.",
        messages=[{"role": "user", "content": prompt}],
    )
    return {
        "provider": "claude",
        "model": model,
        "text": response.content[0].text,
        "tokens_used": response.usage.input_tokens + response.usage.output_tokens,
    }
