import os
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_DEFAULT_DB_FILE = os.path.join(_BACKEND_DIR, "pole_select.db")
_DEFAULT_DB_URL = f"sqlite:///{_DEFAULT_DB_FILE.replace(chr(92), '/')}"
_ENV_FILE = os.path.join(_BACKEND_DIR, ".env")


class Settings(BaseSettings):
    PROJECT_NAME: str = "Pole Select API"
    DATABASE_URL: str = _DEFAULT_DB_URL

    model_config = SettingsConfigDict(env_file=_ENV_FILE, extra="ignore")

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        if isinstance(v, str):
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+psycopg2://", 1)
            if v.startswith("postgresql://"):
                return v.replace("postgresql://", "postgresql+psycopg2://", 1)
        return v


settings = Settings()
