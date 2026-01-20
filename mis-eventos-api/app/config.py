from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    # Base de datos
    DATABASE_URL: str
    DATABASE_ECHO: bool = False

    # Redis
    REDIS_URL: str
    REDIS_CACHE_TTL: int = 300

    # Seguridad
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Aplicación
    APP_NAME: str = "Mis Eventos API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    # Testing
    TEST_DATABASE_URL: str

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    @property
    def origins_list(self) -> list[str]:

        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]


settings = Settings()
