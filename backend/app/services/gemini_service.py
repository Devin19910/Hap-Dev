import google.generativeai as genai
from ..utils.config import settings

genai.configure(api_key=settings.gemini_api_key)


async def complete(prompt: str, model: str = "gemini-2.5-flash", system: str = "") -> dict:
    full_prompt = f"{system}\n\n{prompt}" if system else prompt
    gemini_model = genai.GenerativeModel(model)
    response = gemini_model.generate_content(full_prompt)
    return {
        "provider": "gemini",
        "model": model,
        "text": response.text,
        "tokens_used": 0,
    }
