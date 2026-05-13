from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str = ""
    claude_api_key: str = ""
    gemini_api_key: str = ""
    database_url: str = "postgresql://user:password@localhost:5432/appdb"
    api_secret_key: str = "change-me-in-production"
    default_ai_provider: str = "claude"  # openai | claude | gemini

    class Config:
        env_file = ".env"


settings = Settings()
