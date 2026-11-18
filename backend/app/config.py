import os
from pydantic_settings import BaseSettings

_DEFAULT_DB_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../pole_select.db"))
_DEFAULT_DB_URL = f"sqlite:///{_DEFAULT_DB_FILE.replace(chr(92), '/')}"


class Settings(BaseSettings):
    PROJECT_NAME: str = "Pole Select API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", _DEFAULT_DB_URL)

    class Config:
        env_file = ".env"


settings = Settings()
