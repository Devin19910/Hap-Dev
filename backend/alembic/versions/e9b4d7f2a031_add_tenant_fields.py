"""add tenant fields to clients and admin_users

Revision ID: e9b4d7f2a031
Revises: f4e7d2c1b9a0
Create Date: 2026-05-13

"""
from alembic import op
import sqlalchemy as sa

revision = 'e9b4d7f2a031'
down_revision = 'f4e7d2c1b9a0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── clients (tenant) extensions ──────────────────────────────────────
    op.add_column('clients', sa.Column('slug',          sa.String(), nullable=True))
    op.add_column('clients', sa.Column('status',        sa.String(), server_default='active'))
    op.add_column('clients', sa.Column('business_type', sa.String(), server_default='general'))
    op.add_column('clients', sa.Column('owner_user_id', sa.String(), server_default=''))
    # Per-tenant WhatsApp
    op.add_column('clients', sa.Column('wa_phone_number_id', sa.String(), server_default=''))
    op.add_column('clients', sa.Column('wa_access_token',    sa.String(), server_default=''))
    op.add_column('clients', sa.Column('wa_verify_token',    sa.String(), server_default=''))
    op.add_column('clients', sa.Column('wa_business_name',   sa.String(), server_default=''))
    # Per-tenant AI
    op.add_column('clients', sa.Column('ai_provider', sa.String(), server_default=''))
    # Per-tenant HubSpot
    op.add_column('clients', sa.Column('hubspot_api_key', sa.String(), server_default=''))
    # Per-tenant Zoho
    op.add_column('clients', sa.Column('zoho_client_id',     sa.String(), server_default=''))
    op.add_column('clients', sa.Column('zoho_client_secret', sa.String(), server_default=''))
    op.add_column('clients', sa.Column('zoho_refresh_token', sa.String(), server_default=''))
    # Per-tenant Google Calendar
    op.add_column('clients', sa.Column('google_client_id',     sa.String(), server_default=''))
    op.add_column('clients', sa.Column('google_client_secret', sa.String(), server_default=''))
    op.add_column('clients', sa.Column('google_refresh_token', sa.String(), server_default=''))
    op.add_column('clients', sa.Column('google_calendar_id',   sa.String(), server_default='primary'))
    op.add_column('clients', sa.Column('google_timezone',      sa.String(), server_default='Asia/Kolkata'))
    op.create_index('ix_clients_slug', 'clients', ['slug'], unique=True)

    # ── admin_users: tenant scoping ──────────────────────────────────────
    op.add_column('admin_users', sa.Column('tenant_id', sa.String(), nullable=True))
    op.create_index('ix_admin_users_tenant_id', 'admin_users', ['tenant_id'])


def downgrade() -> None:
    op.drop_index('ix_admin_users_tenant_id', table_name='admin_users')
    op.drop_column('admin_users', 'tenant_id')

    op.drop_index('ix_clients_slug', table_name='clients')
    for col in ['google_timezone', 'google_calendar_id', 'google_refresh_token',
                'google_client_secret', 'google_client_id', 'zoho_refresh_token',
                'zoho_client_secret', 'zoho_client_id', 'hubspot_api_key',
                'ai_provider', 'wa_business_name', 'wa_verify_token',
                'wa_access_token', 'wa_phone_number_id', 'owner_user_id',
                'business_type', 'status', 'slug']:
        op.drop_column('clients', col)
