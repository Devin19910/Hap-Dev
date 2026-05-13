"""add contacts table

Revision ID: c3f1a8b29e04
Revises: 72940979d955
Create Date: 2026-05-13

"""
from alembic import op
import sqlalchemy as sa

revision = 'c3f1a8b29e04'
down_revision = '72940979d955'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "contacts",
        sa.Column("id",             sa.String(), nullable=False),
        sa.Column("client_id",      sa.String(), nullable=False),
        sa.Column("phone_number",   sa.String(), nullable=True, server_default=""),
        sa.Column("email",          sa.String(), nullable=True, server_default=""),
        sa.Column("first_name",     sa.String(), nullable=True, server_default=""),
        sa.Column("last_name",      sa.String(), nullable=True, server_default=""),
        sa.Column("source",         sa.String(), nullable=True, server_default="whatsapp"),
        sa.Column("crm_hubspot_id", sa.String(), nullable=True, server_default=""),
        sa.Column("crm_zoho_id",    sa.String(), nullable=True, server_default=""),
        sa.Column("last_intent",    sa.String(), nullable=True, server_default=""),
        sa.Column("last_urgency",   sa.String(), nullable=True, server_default=""),
        sa.Column("last_summary",   sa.Text(),   nullable=True, server_default=""),
        sa.Column("notes",          sa.Text(),   nullable=True, server_default=""),
        sa.Column("tags",           sa.String(), nullable=True, server_default=""),
        sa.Column("status",         sa.String(), nullable=True, server_default="new"),
        sa.Column("created_at",     sa.DateTime(), nullable=True),
        sa.Column("updated_at",     sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_contacts_client_id",    "contacts", ["client_id"])
    op.create_index("ix_contacts_phone_number", "contacts", ["phone_number"])


def downgrade() -> None:
    op.drop_index("ix_contacts_phone_number", table_name="contacts")
    op.drop_index("ix_contacts_client_id",    table_name="contacts")
    op.drop_table("contacts")
