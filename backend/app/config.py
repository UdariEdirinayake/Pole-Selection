import os
from pydantic_settings import BaseSettings

_DEFAULT_DB_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../pole_select.db"))
_DEFAULT_DB_URL = f"sqlite:///{_DEFAULT_DB_FILE.replace(chr(92), '/')}"


_raw_url = os.getenv("DATABASE_URL", _DEFAULT_DB_URL)
if _raw_url.startswith("postgres://"):
    _raw_url = _raw_url.replace("postgres://", "postgresql://", 1)


class Settings(BaseSettings):
    PROJECT_NAME: str = "Pole Select API"
    DATABASE_URL: str = _raw_url

    class Config:
        env_file = ".env"


settings = Settings()
