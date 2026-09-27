from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.exceptions.access_exceptions import AcessoNegadoError
from app.exceptions.academic_exceptions import (
    DisciplinaNaoEncontradaError,
    ProfessorNaoEncontradoError,
    TurmaNaoEncontradaError,
)
from app.repositories.discipline_repository import DisciplineRepository
from app.repositories.school_class_repository import SchoolClassRepository
from app.repositories.student_repository import StudentRepository
from app.repositories.teacher_repository import TeacherRepository
from app.schemas.academic_schema import (
    SchoolClassCreateRequest,
    SchoolClassDetailResponse,
    SchoolClassPassingAverageUpdateRequest,
    SchoolClassResponse,
    SchoolClassUpdateRequest,
)
from app.services.auth_dependencies import get_current_user, require_admin
from app.services.school_class_service import SchoolClassService


router = APIRouter(prefix="/classes", tags=["Classes"])


def get_school_class_service(db: Session = Depends(get_db)):
    return SchoolClassService(
        SchoolClassRepository(db),
        DisciplineRepository(db),
        StudentRepository(db),
        TeacherRepository(db)
    )


@router.post("", response_model=SchoolClassResponse)
def create_class(
    data: SchoolClassCreateRequest,
    admin=Depends(require_admin),
    service: SchoolClassService = Depends(get_school_class_service)
):
    try:
        return service.create(data.name, data.year, data.discipline_id, data.teacher_id, data.passing_average)
    except (DisciplinaNaoEncontradaError, ProfessorNaoEncontradoError) as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.get("", response_model=list[SchoolClassResponse])
def list_classes(
    current_user=Depends(get_current_user),
    service: SchoolClassService = Depends(get_school_class_service)
):
    return service.list_for_user(current_user)


@router.get("/{public_id}", response_model=SchoolClassDetailResponse)
def get_class_detail(
    public_id: str,
    current_user=Depends(get_current_user),
    service: SchoolClassService = Depends(get_school_class_service)
):
    try:
        school_class = service.get_with_details_for_user(public_id, current_user)
    except TurmaNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except AcessoNegadoError as error:
        raise HTTPException(status_code=403, detail=str(error))

    return {
        "public_id": school_class.public_id,
        "name": school_class.name,
        "year": school_class.year,
        "passing_average": school_class.passing_average,
        "discipline": school_class.discipline,
        "teacher": school_class.teacher,
        "students": [
            {
                "public_id": enrollment.student.public_id,
                "registration": enrollment.student.registration,
                "user_public_id": enrollment.student.user_public_id,
                "enrollment_id": enrollment.public_id,
                "user": {
                    "id": enrollment.student.user.public_id,
                    "name": enrollment.student.user.name,
                    "email": enrollment.student.user.email,
                },
            }
            for enrollment in school_class.enrollments
        ],
    }

@router.put("/{public_id}", response_model=SchoolClassResponse)
def update_class(
    public_id: str,
    data: SchoolClassUpdateRequest,
    admin=Depends(require_admin),
    service: SchoolClassService = Depends(get_school_class_service)
):
    try:
        return service.update(public_id, data.name, data.year, data.teacher_id)
    except (TurmaNaoEncontradaError, ProfessorNaoEncontradoError) as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.put("/{public_id}/passing-average", response_model=SchoolClassResponse)
def update_passing_average(
    public_id: str,
    data: SchoolClassPassingAverageUpdateRequest,
    current_user=Depends(get_current_user),
    service: SchoolClassService = Depends(get_school_class_service)
):
    try:
        return service.update_passing_average(public_id, data.passing_average, current_user)
    except TurmaNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except AcessoNegadoError as error:
        raise HTTPException(status_code=403, detail=str(error))


@router.delete("/{public_id}", status_code=204)
def delete_class(
    public_id: str,
    admin=Depends(require_admin),
    service: SchoolClassService = Depends(get_school_class_service)
):
    try:
        service.delete(public_id)
    except TurmaNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))