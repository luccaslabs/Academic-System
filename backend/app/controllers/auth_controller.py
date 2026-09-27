from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
import secrets

from app.config.settings import ACCESS_TOKEN_EXPIRE_MINUTES, COOKIE_SAMESITE, COOKIE_SECURE

#           |
#           |
#           |
#         \ | /
#       - - O - -
#         / | \
#
#  @developer Lucas

from app.core.rate_limiter import limiter
from app.database.connection import get_db
from app.exceptions.auth_exceptions import (
    CredenciaisInvalidasError,
    EmailJaCadastradoError,
)
from app.repositories.user_repository import UserRepository
from app.schemas.auth_schema import (
    LoginRequest,
    RegisterRequest,
    TokenResponse
)
from app.services.auth_service import AuthService
from app.schemas.user_schema import UserResponse


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


def get_auth_service(
    db: Session = Depends(get_db)
):
    repository = UserRepository(db)

    return AuthService(repository)


@router.post("/register", response_model=UserResponse)
@limiter.limit("3/minute")
def register(
    request: Request,
    data: RegisterRequest,
    service: AuthService = Depends(get_auth_service)
):
    try:
        return service.register(name=data.name, email=data.email, password=data.password)
    except EmailJaCadastradoError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(
    request: Request,
    response: Response,
    data: LoginRequest,
    service: AuthService = Depends(get_auth_service)
):
    try:
        token = service.login(email=data.email, password=data.password)
    except CredenciaisInvalidasError as error:
        raise HTTPException(status_code=401, detail=str(error))

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    csrf_token = secrets.token_urlsafe(32)
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    return {"access_token": token, "token_type": "bearer"}


@router.post("/logout", status_code=204)
def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("csrf_token", path="/")