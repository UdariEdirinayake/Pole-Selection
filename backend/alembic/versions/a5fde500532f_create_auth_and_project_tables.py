"""create_auth_and_project_tables

Revision ID: a5fde500532f
Revises: 73a833a806de
Create Date: 2026-11-18 13:04:16.160802

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a5fde500532f'
down_revision: Union[str, None] = '73a833a806de'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if "user" not in tables:
        op.create_table(
            "user",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("email", sa.String(255), unique=True, index=True, nullable=False),
            sa.Column("password_hash", sa.String(255), nullable=False),
            sa.Column("role", sa.String(50), default="designer", nullable=False),
            sa.Column("active", sa.Boolean(), default=True, nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )
    if "project" not in tables:
        op.create_table(
            "project",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("line_arrangement", sa.String(50), default="11 kV + LV", nullable=False),
            sa.Column("status", sa.String(50), default="Not calculated", nullable=False),
            sa.Column("owner_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=False, index=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
        )
    if "circuit" not in tables:
        op.create_table(
            "circuit",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("project_id", sa.Integer(), sa.ForeignKey("project.id"), nullable=False, index=True),
            sa.Column("circuit_name", sa.String(100), nullable=False),
            sa.Column("nominal_voltage_kv", sa.Float(), nullable=False),
            sa.Column("circuit_type", sa.String(100), nullable=False),
            sa.Column("conductor_code", sa.Integer(), nullable=True),
            sa.Column("conductor_name", sa.String(100), nullable=True),
            sa.Column("lookup_table", sa.String(50), nullable=True),
        )
    if "pole" not in tables:
        op.create_table(
            "pole",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("project_id", sa.Integer(), sa.ForeignKey("project.id"), nullable=False, index=True),
            sa.Column("section", sa.Integer(), default=1, nullable=False),
            sa.Column("pole_no", sa.Integer(), nullable=False),
            sa.Column("pole_id_name", sa.String(50), nullable=True),
            sa.Column("aft_span_m", sa.Float(), default=0.0, nullable=False),
            sa.Column("fore_span_m", sa.Float(), default=0.0, nullable=False),
            sa.Column("angle_deg", sa.Float(), default=0.0, nullable=False),
            sa.Column("soil_class_num", sa.Integer(), default=4, nullable=False),
            sa.Column("equipment", sa.String(100), nullable=True),
            sa.Column("span_environment", sa.String(255), default="across any road or street", nullable=False),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if "pole" in tables:
        op.drop_table("pole")
    if "circuit" in tables:
        op.drop_table("circuit")
    if "project" in tables:
        op.drop_table("project")
    if "user" in tables:
        op.drop_table("user")
