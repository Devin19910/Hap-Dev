"""add appointments table

Revision ID: f4e7d2c1b9a0
Revises: c3f1a8b29e04
Create Date: 2026-05-13

"""
from alembic import op
import sqlalchemy as sa

revision = 'f4e7d2c1b9a0'
down_revision = 'c3f1a8b29e04'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "appointments",
        sa.Column("id",                sa.String(),  nullable=False),
        sa.Column("client_id",         sa.String(),  nullable=False),
        sa.Column("contact_id",        sa.String(),  nullable=True, server_default=""),
        sa.Column("phone_number",      sa.String(),  nullable=True, server_default=""),
        sa.Column("customer_name",     sa.String(),  nullable=True, server_default=""),
        sa.Column("service",           sa.String(),  nullable=True, server_default=""),
        sa.Column("notes",             sa.Text(),    nullable=True, server_default=""),
        sa.Column("requested_at_text", sa.String(),  nullable=True, server_default=""),
        sa.Column("scheduled_at",      sa.DateTime(), nullable=True),
        sa.Column("duration_minutes",  sa.Integer(), nullable=True, server_default="60"),
        sa.Column("status",            sa.String(),  nullable=True, server_default="pending"),
        sa.Column("google_event_id",   sa.String(),  nullable=True, server_default=""),
        sa.Column("reminder_sent",     sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("created_at",        sa.DateTime(), nullable=True),
        sa.Column("updated_at",        sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_appointments_client_id",   "appointments", ["client_id"])
    op.create_index("ix_appointments_phone_number","appointments", ["phone_number"])
    op.create_index("ix_appointments_status",      "appointments", ["status"])


def downgrade() -> None:
    op.drop_index("ix_appointments_status",       table_name="appointments")
    op.drop_index("ix_appointments_phone_number", table_name="appointments")
    op.drop_index("ix_appointments_client_id",    table_name="appointments")
    op.drop_table("appointments")
