"""add_clearance_inputs_to_project

Revision ID: 553e9dfdea8f
Revises: a5fde500532f
Create Date: 2026-11-19 08:50:23.995033

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '553e9dfdea8f'
down_revision: Union[str, None] = 'a5fde500532f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if "project" in tables:
        columns = [c["name"] for c in inspector.get_columns("project")]
        with op.batch_alter_table("project", schema=None) as batch_op:
            if "attachment_height_below_pole_top_m" not in columns:
                batch_op.add_column(sa.Column("attachment_height_below_pole_top_m", sa.Float(), nullable=True))
            if "vertical_spacing_11kv_lv_m" not in columns:
                batch_op.add_column(sa.Column("vertical_spacing_11kv_lv_m", sa.Float(), nullable=True))
            if "terrain_height_m" not in columns:
                batch_op.add_column(sa.Column("terrain_height_m", sa.Float(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if "project" in tables:
        columns = [c["name"] for c in inspector.get_columns("project")]
        with op.batch_alter_table("project", schema=None) as batch_op:
            if "terrain_height_m" in columns:
                batch_op.drop_column("terrain_height_m")
            if "vertical_spacing_11kv_lv_m" in columns:
                batch_op.drop_column("vertical_spacing_11kv_lv_m")
            if "attachment_height_below_pole_top_m" in columns:
                batch_op.drop_column("attachment_height_below_pole_top_m")
