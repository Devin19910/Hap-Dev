---
name: 002-docker-rebuild-after-deps
type: lesson
date: 2026-05-13
---

# Lesson: Always Rebuild Docker After Changing requirements.txt

## What Happened
We updated `gemini_service.py` to use `from google import genai` and changed `requirements.txt`
to `google-genai`. Hot reload picked up the Python file change but the container still had
the old package installed — causing an `ImportError` that crashed the backend.

## Fix
After any `requirements.txt` change, you MUST rebuild the container:
```bash
cd docker && docker compose up --build -d
```

## Prevention
- Hot reload (watchfiles) only reloads Python code, NOT installed packages
- Package changes always need `--build`
- Rule: changed `requirements.txt`? Always rebuild.
