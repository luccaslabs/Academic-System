from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.exceptions.academic_exceptions import (
    AlunoNaoEncontradoError,
    MatriculaJaExistenteError,
    MatriculaNaoEncontradaError,
    TurmaNaoEncontradaError,
)
from app.repositories.enrollment_repository import EnrollmentRepository
from app.repositories.school_class_repository import SchoolClassRepository
from app.repositories.student_repository import StudentRepository
from app.schemas.academic_schema import EnrollmentCreateRequest, EnrollmentResponse
from app.services.auth_dependencies import require_admin
from app.services.enrollment_service import EnrollmentService


router = APIRouter(prefix="/enrollments", tags=["Enrollments"])


def get_enrollment_service(db: Session = Depends(get_db)):
    return EnrollmentService(
        EnrollmentRepository(db),
        StudentRepository(db),
        SchoolClassRepository(db)
    )


@router.post("", response_model=EnrollmentResponse)
def enroll_student(
    data: EnrollmentCreateRequest,
    admin=Depends(require_admin),
    service: EnrollmentService = Depends(get_enrollment_service)
):
    try:
        return service.enroll(data.student_id, data.class_id)
    except (AlunoNaoEncontradoError, TurmaNaoEncontradaError) as error:
        raise HTTPException(status_code=404, detail=str(error))
    except MatriculaJaExistenteError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.delete("/{public_id}", status_code=204)
def unenroll_student(
    public_id: str,
    admin=Depends(require_admin),
    service: EnrollmentService = Depends(get_enrollment_service)
):
    try:
        service.unenroll(public_id)
    except MatriculaNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))