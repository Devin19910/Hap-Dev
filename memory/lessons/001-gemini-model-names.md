---
name: 001-gemini-model-names
type: lesson
date: 2026-05-13
---

# Lesson: Gemini Model Names Change Frequently

## What Happened
When we first deployed, `gemini-1.5-flash` returned a 404 because it was no longer available
on this API key tier. Then `gemini-2.0-flash` also returned a 404 saying "no longer available
to new users."

## Fix
Use `genai.list_models()` to check available models for your API key before hardcoding a model name.
Currently working: `gemini-2.5-flash`

## Prevention
- Always verify model names against `list_models()` after creating a new API key
- Run this check: `docker exec docker-backend-1 python3 -c "import google.generativeai as genai; import os; genai.configure(api_key=os.environ.get('GEMINI_API_KEY','')); [print(m.name) for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]"`
