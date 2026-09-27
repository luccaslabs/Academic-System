import os

from dotenv import find_dotenv, load_dotenv

load_dotenv(find_dotenv())


def _get_required_env(key: str) -> str:
    value = os.getenv(key)

    if not value:
        raise RuntimeError(
            f"Variável de ambiente obrigatória não definida: {key}"
        )

    return value


DATABASE_URL = _get_required_env("DATABASE_URL")

JWT_SECRET_KEY = _get_required_env("JWT_SECRET_KEY")

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "true").lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax")