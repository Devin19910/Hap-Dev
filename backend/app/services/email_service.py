import resend
from ..utils.config import settings


def _sender() -> str:
    return f"{settings.resend_from_name} <{settings.resend_from_email}>"


def send_password_reset(to_email: str, reset_url: str, first_name: str = "") -> None:
    if not settings.resend_api_key:
        return
    resend.api_key = settings.resend_api_key
    name = first_name or "there"
    resend.Emails.send({
        "from": _sender(),
        "to": [to_email],
        "subject": "Reset your Nexora password",
        "html": f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f172a;color:#f1f5f9;border-radius:12px">
          <div style="margin-bottom:24px">
            <span style="font-size:20px;font-weight:700;color:#0ea5e9">Nexora</span>
          </div>
          <h2 style="margin:0 0 8px;font-size:22px;color:#ffffff">Reset your password</h2>
          <p style="color:#94a3b8;margin:0 0 24px">Hi {name}, click the button below to set a new password. This link expires in 1 hour.</p>
          <a href="{reset_url}"
             style="display:inline-block;padding:12px 28px;background:#0ea5e9;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px">
            Reset password
          </a>
          <p style="color:#475569;font-size:12px;margin-top:24px">
            If you did not request this, ignore this email — your password will not change.<br>
            Or copy this link: {reset_url}
          </p>
        </div>
        """,
    })
