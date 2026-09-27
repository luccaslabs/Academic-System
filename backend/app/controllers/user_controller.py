from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.exceptions.auth_exceptions import UsuarioNaoEncontradoError
from app.repositories.user_repository import UserRepository
from app.schemas.user_schema import (
    UserResponse,
    UserRoleUpdateRequest,
    UserUpdateRequest,
)
from app.services.auth_dependencies import get_current_user, require_admin
from app.services.user_service import UserService


router = APIRouter(prefix="/users", tags=["Users"])


def get_user_service(db: Session = Depends(get_db)):
    return UserService(UserRepository(db))


@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user=Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_my_profile(
    data: UserUpdateRequest,
    current_user=Depends(get_current_user),
    service: UserService = Depends(get_user_service)
):
    if current_user.role == "student":
        raise HTTPException(
            status_code=403,
            detail="Alunos não podem alterar nome ou e-mail, apenas visualizar o perfil"
        )

    try:
        return service.update_profile(user_id=current_user.id, name=data.name, email=data.email)
    except UsuarioNaoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.get("", response_model=list[UserResponse])
def list_users(
    admin=Depends(require_admin),
    service: UserService = Depends(get_user_service)
):
    return service.list_users()


@router.put("/{public_id}/role", response_model=UserResponse)
def update_user_role(
    public_id: str,
    data: UserRoleUpdateRequest,
    admin=Depends(require_admin),
    service: UserService = Depends(get_user_service)
):
    try:
        target = service.get_by_public_id(public_id)
    except UsuarioNaoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error))

    if target.id == admin.id:
        raise HTTPException(status_code=400, detail="Não é possível alterar a própria role")

    return service.update_role(target.id, data.role)


@router.delete("/{public_id}", status_code=204)
def delete_user(
    public_id: str,
    admin=Depends(require_admin),
    service: UserService = Depends(get_user_service)
):
    try:
        target = service.get_by_public_id(public_id)
    except UsuarioNaoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error))

    if target.id == admin.id:
        raise HTTPException(status_code=400, detail="Não é possível excluir a própria conta")

    service.delete_user(target.id)