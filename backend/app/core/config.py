from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    mongo_uri: str = "mongodb://localhost:27017"
    db_name: str = "deployments"
    cors_origins: list[str] = ["http://localhost:3000"]


settings = Settings()
