"""add call_logs table and vapi fields to clients

Revision ID: a1b2c3d4e5f6
Revises: e9b4d7f2a031
Create Date: 2026-05-14

"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = 'e9b4d7f2a031'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── call_logs table ───────────────────────────────────────────────────────
    op.create_table(
        'call_logs',
        sa.Column('id',               sa.String(),  primary_key=True),
        sa.Column('client_id',        sa.String(),  nullable=False),
        sa.Column('contact_id',       sa.String(),  nullable=True,  server_default=''),
        sa.Column('phone_number',     sa.String(),  nullable=False, server_default=''),
        sa.Column('direction',        sa.String(),  nullable=False, server_default='outbound'),
        sa.Column('status',           sa.String(),  nullable=False, server_default='queued'),
        sa.Column('duration_seconds', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('transcript',       sa.Text(),    nullable=False, server_default=''),
        sa.Column('recording_url',    sa.String(),  nullable=False, server_default=''),
        sa.Column('vapi_call_id',     sa.String(),  nullable=False, server_default=''),
        sa.Column('ended_reason',     sa.String(),  nullable=False, server_default=''),
        sa.Column('created_at',       sa.DateTime(), nullable=True),
        sa.Column('updated_at',       sa.DateTime(), nullable=True),
    )
    op.create_index('ix_call_logs_client_id',    'call_logs', ['client_id'])
    op.create_index('ix_call_logs_phone_number', 'call_logs', ['phone_number'])
    op.create_index('ix_call_logs_vapi_call_id', 'call_logs', ['vapi_call_id'])

    # ── vapi credentials on clients ───────────────────────────────────────────
    op.add_column('clients', sa.Column('vapi_api_key',         sa.String(), server_default=''))
    op.add_column('clients', sa.Column('vapi_phone_number_id', sa.String(), server_default=''))


def downgrade() -> None:
    op.drop_column('clients', 'vapi_phone_number_id')
    op.drop_column('clients', 'vapi_api_key')

    op.drop_index('ix_call_logs_vapi_call_id', table_name='call_logs')
    op.drop_index('ix_call_logs_phone_number',  table_name='call_logs')
    op.drop_index('ix_call_logs_client_id',     table_name='call_logs')
    op.drop_table('call_logs')
