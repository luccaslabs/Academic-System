from fastapi import Cookie, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

import jwt

from app.config.settings import JWT_ALGORITHM, JWT_SECRET_KEY
from app.database.connection import get_db
from app.repositories.user_repository import UserRepository


security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db)
):
    token = credentials.credentials if credentials else access_token

    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")

    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

    user_id = payload.get("sub")

    if user_id is None:
        raise HTTPException(status_code=401, detail="Token inválido")

    repository = UserRepository(db)
    user = repository.find_by_id(int(user_id))

    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")

    return user


def require_admin(current_user=Depends(get_current_user)):

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")

    return current_user