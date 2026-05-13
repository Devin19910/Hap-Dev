from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str = ""
    claude_api_key: str = ""
    gemini_api_key: str = ""
    database_url: str = "postgresql://user:password@localhost:5432/appdb"
    api_secret_key: str = "change-me-in-production"
    jwt_secret_key: str = ""            # falls back to api_secret_key if not set
    default_ai_provider: str = "claude"
    webhook_secret: str = "webhook-secret-change-me"
    n8n_user: str = "admin"
    n8n_password: str = "changeme"
    # Seed admin account (created on first startup if no admin users exist)
    admin_email: str = "admin@example.com"
    admin_password: str = "changeme"
    admin_first_name: str = "Admin"
    # WhatsApp Cloud API
    whatsapp_phone_number_id: str = ""   # from Meta developer dashboard
    whatsapp_access_token: str = ""      # permanent token or system user token
    whatsapp_verify_token: str = "whatsapp-verify-changeme"  # you choose this
    whatsapp_client_id: str = ""         # which client_id this WA line belongs to
    whatsapp_business_name: str = "Our Business"  # used in AI reply prompt

    @property
    def effective_jwt_secret(self) -> str:
        return self.jwt_secret_key or self.api_secret_key

    class Config:
        env_file = ".env"


settings = Settings()
