import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Pole Select API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./pole_select.db")

    class Config:
        env_file = ".env"


settings = Settings()
