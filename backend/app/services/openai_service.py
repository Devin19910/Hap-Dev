from openai import AsyncOpenAI
from ..utils.config import settings

client = AsyncOpenAI(api_key=settings.openai_api_key)


async def complete(prompt: str, model: str = "gpt-4o-mini", system: str = "") -> dict:
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    response = await client.chat.completions.create(
        model=model,
        messages=messages,
    )
    return {
        "provider": "openai",
        "model": model,
        "text": response.choices[0].message.content,
        "tokens_used": response.usage.total_tokens,
    }
