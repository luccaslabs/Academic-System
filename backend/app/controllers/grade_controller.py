from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.exceptions.access_exceptions import AcessoNegadoError
from app.exceptions.academic_exceptions import MatriculaNaoEncontradaError
from app.exceptions.tracking_exceptions import NotaNaoEncontradaError
from app.repositories.enrollment_repository import EnrollmentRepository
from app.repositories.grade_repository import GradeRepository
from app.schemas.tracking_schema import (
    GradeAverageResponse,
    GradeCreateRequest,
    GradeResponse,
    GradeUpdateRequest,
)
from app.services.auth_dependencies import get_current_user, require_admin
from app.services.grade_service import GradeService


router = APIRouter(prefix="/grades", tags=["Grades"])


def get_grade_service(db: Session = Depends(get_db)):
    return GradeService(GradeRepository(db), EnrollmentRepository(db))


@router.post("", response_model=GradeResponse)
def create_grade(
    data: GradeCreateRequest,
    admin=Depends(require_admin),
    service: GradeService = Depends(get_grade_service)
):
    try:
        return service.create(data.enrollment_id, data.value, data.term, data.description)
    except MatriculaNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.get("/enrollment/{enrollment_public_id}", response_model=list[GradeResponse])
def list_grades(
    enrollment_public_id: str,
    current_user=Depends(get_current_user),
    service: GradeService = Depends(get_grade_service)
):
    try:
        return service.list_for_enrollment(enrollment_public_id, current_user)
    except MatriculaNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except AcessoNegadoError as error:
        raise HTTPException(status_code=403, detail=str(error))


@router.get("/enrollment/{enrollment_public_id}/average", response_model=GradeAverageResponse)
def get_grade_average(
    enrollment_public_id: str,
    current_user=Depends(get_current_user),
    service: GradeService = Depends(get_grade_service)
):
    try:
        return service.get_average_for_enrollment(enrollment_public_id, current_user)
    except MatriculaNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except AcessoNegadoError as error:
        raise HTTPException(status_code=403, detail=str(error))


@router.put("/{public_id}", response_model=GradeResponse)
def update_grade(
    public_id: str,
    data: GradeUpdateRequest,
    admin=Depends(require_admin),
    service: GradeService = Depends(get_grade_service)
):
    try:
        return service.update(public_id, data.value, data.description)
    except NotaNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.delete("/{public_id}", status_code=204)
def delete_grade(
    public_id: str,
    admin=Depends(require_admin),
    service: GradeService = Depends(get_grade_service)
):
    try:
        service.delete(public_id)
    except NotaNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))