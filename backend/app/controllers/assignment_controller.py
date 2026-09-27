from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.exceptions.access_exceptions import AcessoNegadoError
from app.exceptions.academic_exceptions import TurmaNaoEncontradaError
from app.exceptions.tracking_exceptions import AtividadeNaoEncontradaError
from app.repositories.assignment_repository import AssignmentRepository
from app.repositories.school_class_repository import SchoolClassRepository
from app.repositories.student_repository import StudentRepository
from app.schemas.tracking_schema import (
    AssignmentCreateRequest,
    AssignmentResponse,
    AssignmentUpdateRequest,
)
from app.services.assignment_service import AssignmentService
from app.services.auth_dependencies import get_current_user, require_admin


router = APIRouter(prefix="/assignments", tags=["Assignments"])


def get_assignment_service(db: Session = Depends(get_db)):
    return AssignmentService(AssignmentRepository(db), SchoolClassRepository(db), StudentRepository(db))


@router.post("", response_model=AssignmentResponse)
def create_assignment(
    data: AssignmentCreateRequest,
    admin=Depends(require_admin),
    service: AssignmentService = Depends(get_assignment_service)
):
    try:
        return service.create(
            data.class_id, data.title, data.description,
            data.due_date, data.accepts_submissions, admin.id
        )
    except TurmaNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.get("", response_model=list[AssignmentResponse])
def list_my_assignments(
    current_user=Depends(get_current_user),
    service: AssignmentService = Depends(get_assignment_service)
):
    return service.list_visible_to(current_user.id)


@router.get("/class/{class_public_id}", response_model=list[AssignmentResponse])
def list_class_assignments(
    class_public_id: str,
    current_user=Depends(get_current_user),
    service: AssignmentService = Depends(get_assignment_service)
):
    try:
        return service.list_for_class(class_public_id)
    except TurmaNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.get("/{public_id}", response_model=AssignmentResponse)
def get_assignment(
    public_id: str,
    current_user=Depends(get_current_user),
    service: AssignmentService = Depends(get_assignment_service)
):
    try:
        return service.get_for_user(public_id, current_user)
    except AtividadeNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except AcessoNegadoError as error:
        raise HTTPException(status_code=403, detail=str(error))


@router.put("/{public_id}", response_model=AssignmentResponse)
def update_assignment(
    public_id: str,
    data: AssignmentUpdateRequest,
    admin=Depends(require_admin),
    service: AssignmentService = Depends(get_assignment_service)
):
    try:
        return service.update(
            public_id, data.title, data.description,
            data.due_date, data.accepts_submissions
        )
    except AtividadeNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.delete("/{public_id}", status_code=204)
def delete_assignment(
    public_id: str,
    admin=Depends(require_admin),
    service: AssignmentService = Depends(get_assignment_service)
):
    try:
        service.delete(public_id)
    except AtividadeNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))