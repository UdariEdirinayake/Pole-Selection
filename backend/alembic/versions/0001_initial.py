"""Initial pole catalog table

Revision ID: 0001_initial
Revises: 
Create Date: 2026-11-18 11:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'pole_catalog',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('catalog_code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pole_catalog_catalog_code'), 'pole_catalog', ['catalog_code'], unique=True)
    op.create_index(op.f('ix_pole_catalog_id'), 'pole_catalog', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_pole_catalog_id'), table_name='pole_catalog')
    op.drop_index(op.f('ix_pole_catalog_catalog_code'), table_name='pole_catalog')
    op.drop_table('pole_catalog')
