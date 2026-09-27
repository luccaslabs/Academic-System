from datetime import datetime, timedelta, timezone
import jwt
from pwdlib import PasswordHash
from app.config.settings import (
    JWT_ALGORITHM,
    JWT_SECRET_KEY,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from app.exceptions.auth_exceptions import (
    CredenciaisInvalidasError,
    EmailJaCadastradoError,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user_schema import UserRole


password_hash = PasswordHash.recommended()


class AuthService:

    def __init__(self, repository: UserRepository):
        self.repository = repository

    def register(self, name: str, email: str, password: str):
        

        existing_user = self.repository.find_by_email(email)

        if existing_user:
            raise EmailJaCadastradoError("E-mail já cadastrado")

        hashed_password = password_hash.hash(password)

        user = User(
            name=name,
            email=email,
            password_hash=hashed_password,
            role=UserRole.student.value
        )

        return self.repository.create(user)

    def login(self, email: str, password: str):

        user = self.repository.find_by_email(email)

        if not user:
            raise CredenciaisInvalidasError("Credenciais inválidas")

        valid_password = password_hash.verify(
            password,
            user.password_hash
        )

        if not valid_password:
            raise CredenciaisInvalidasError("Credenciais inválidas")

        token = self._create_token(user.id, user.role)

        return token

    def _create_token(self, user_id: int, role: str):

        expiration = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

        payload = {
            "sub": str(user_id),
            "role": role,
            "exp": expiration
        }

        return jwt.encode(
            payload,
            JWT_SECRET_KEY,
            algorithm=JWT_ALGORITHM
        )