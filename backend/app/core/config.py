import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    STORAGE_DIR: str = "/app/storage"
    MAX_FILES_PER_MESSAGE: int = 10

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', '.env')


settings = Settings()