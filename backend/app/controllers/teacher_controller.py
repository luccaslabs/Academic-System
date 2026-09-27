from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.exceptions.academic_exceptions import ProfessorNaoEncontradoError
from app.exceptions.auth_exceptions import UsuarioNaoEncontradoError
from app.repositories.teacher_repository import TeacherRepository
from app.repositories.user_repository import UserRepository
from app.schemas.academic_schema import (
    TeacherCreateRequest,
    TeacherResponse,
    TeacherUpdateRequest,
)
from app.services.auth_dependencies import get_current_user, require_admin
from app.services.teacher_service import TeacherService


router = APIRouter(prefix="/teachers", tags=["Teachers"])


def get_teacher_service(db: Session = Depends(get_db)):
    return TeacherService(TeacherRepository(db), UserRepository(db))


@router.post("", response_model=TeacherResponse)
def create_teacher(
    data: TeacherCreateRequest,
    admin=Depends(require_admin),
    service: TeacherService = Depends(get_teacher_service)
):
    try:
        return service.create(data.user_id, data.registration)
    except UsuarioNaoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.get("", response_model=list[TeacherResponse])
def list_teachers(
    current_user=Depends(get_current_user),
    service: TeacherService = Depends(get_teacher_service)
):
    return service.list()


@router.get("/{public_id}", response_model=TeacherResponse)
def get_teacher(
    public_id: str,
    current_user=Depends(get_current_user),
    service: TeacherService = Depends(get_teacher_service)
):
    try:
        return service.get_by_public_id(public_id)
    except ProfessorNaoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.put("/{public_id}", response_model=TeacherResponse)
def update_teacher(
    public_id: str,
    data: TeacherUpdateRequest,
    admin=Depends(require_admin),
    service: TeacherService = Depends(get_teacher_service)
):
    try:
        return service.update(public_id, data.registration)
    except ProfessorNaoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.delete("/{public_id}", status_code=204)
def delete_teacher(
    public_id: str,
    admin=Depends(require_admin),
    service: TeacherService = Depends(get_teacher_service)
):
    try:
        service.delete(public_id)
    except ProfessorNaoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error))