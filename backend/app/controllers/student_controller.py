from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.exceptions.academic_exceptions import AlunoNaoEncontradoError
from app.exceptions.auth_exceptions import UsuarioNaoEncontradoError
from app.repositories.student_repository import StudentRepository
from app.repositories.user_repository import UserRepository
from app.schemas.academic_schema import (
    StudentCreateRequest,
    StudentResponse,
    StudentUpdateRequest,
)
from app.services.auth_dependencies import get_current_user, require_admin
from app.services.student_service import StudentService


router = APIRouter(prefix="/students", tags=["Students"])


def get_student_service(db: Session = Depends(get_db)):
    return StudentService(StudentRepository(db), UserRepository(db))


@router.post("", response_model=StudentResponse)
def create_student(
    data: StudentCreateRequest,
    admin=Depends(require_admin),
    service: StudentService = Depends(get_student_service)
):
    try:
        return service.create(data.user_id, data.registration)
    except UsuarioNaoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.get("", response_model=list[StudentResponse])
def list_students(
    current_user=Depends(get_current_user),
    service: StudentService = Depends(get_student_service)
):
    return service.list()


@router.get("/{public_id}", response_model=StudentResponse)
def get_student(
    public_id: str,
    current_user=Depends(get_current_user),
    service: StudentService = Depends(get_student_service)
):
    try:
        return service.get_by_public_id(public_id)
    except AlunoNaoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.put("/{public_id}", response_model=StudentResponse)
def update_student(
    public_id: str,
    data: StudentUpdateRequest,
    admin=Depends(require_admin),
    service: StudentService = Depends(get_student_service)
):
    try:
        return service.update(public_id, data.registration)
    except AlunoNaoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.delete("/{public_id}", status_code=204)
def delete_student(
    public_id: str,
    admin=Depends(require_admin),
    service: StudentService = Depends(get_student_service)
):
    try:
        service.delete(public_id)
    except AlunoNaoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error))