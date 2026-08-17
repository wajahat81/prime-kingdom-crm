from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Prime Kingdom CRM API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security Context
    JWT_SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 720 # 12 hours
    
    # Database
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

# Instantiate settings to be imported across the app
settings = Settings()