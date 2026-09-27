from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.exceptions.access_exceptions import AcessoNegadoError
from app.exceptions.academic_exceptions import MatriculaNaoEncontradaError
from app.exceptions.tracking_exceptions import (
    FrequenciaJaRegistradaError,
    FrequenciaNaoEncontradaError,
)
from app.repositories.attendance_repository import AttendanceRepository
from app.repositories.enrollment_repository import EnrollmentRepository
from app.schemas.tracking_schema import (
    AttendanceRegisterRequest,
    AttendanceResponse,
    AttendanceUpdateRequest,
)
from app.services.attendance_service import AttendanceService
from app.services.auth_dependencies import get_current_user, require_admin


router = APIRouter(prefix="/attendance", tags=["Attendance"])


def get_attendance_service(db: Session = Depends(get_db)):
    return AttendanceService(AttendanceRepository(db), EnrollmentRepository(db))


@router.post("", response_model=AttendanceResponse)
def register_attendance(
    data: AttendanceRegisterRequest,
    admin=Depends(require_admin),
    service: AttendanceService = Depends(get_attendance_service)
):
    try:
        return service.register(data.enrollment_id, data.class_date, data.present)
    except MatriculaNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except FrequenciaJaRegistradaError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.get("/enrollment/{enrollment_public_id}", response_model=list[AttendanceResponse])
def list_attendance(
    enrollment_public_id: str,
    current_user=Depends(get_current_user),
    service: AttendanceService = Depends(get_attendance_service)
):
    try:
        return service.list_for_enrollment(enrollment_public_id, current_user)
    except MatriculaNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except AcessoNegadoError as error:
        raise HTTPException(status_code=403, detail=str(error))


@router.put("/{public_id}", response_model=AttendanceResponse)
def update_attendance(
    public_id: str,
    data: AttendanceUpdateRequest,
    admin=Depends(require_admin),
    service: AttendanceService = Depends(get_attendance_service)
):
    try:
        return service.update(public_id, data.present)
    except FrequenciaNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))