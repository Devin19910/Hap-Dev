from ..utils.config import settings
from . import openai_service, claude_service, gemini_service


async def run(prompt: str, provider: str = "", system: str = "") -> dict:
    """Route an AI request to the correct provider. Falls back to default if none specified."""
    target = provider or settings.default_ai_provider

    if target == "openai":
        return await openai_service.complete(prompt, system=system)
    elif target == "gemini":
        return await gemini_service.complete(prompt, system=system)
    else:
        return await claude_service.complete(prompt, system=system)
