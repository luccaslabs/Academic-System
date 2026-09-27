from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.exceptions.access_exceptions import AcessoNegadoError
from app.exceptions.academic_exceptions import TurmaNaoEncontradaError
from app.exceptions.communication_exceptions import AvisoNaoEncontradoError
from app.repositories.notice_repository import NoticeRepository
from app.repositories.notification_repository import NotificationRepository
from app.repositories.school_class_repository import SchoolClassRepository
from app.repositories.student_repository import StudentRepository
from app.repositories.teacher_repository import TeacherRepository
from app.repositories.user_repository import UserRepository
from app.schemas.communication_schema import NoticeCreateRequest, NoticeResponse
from app.services.auth_dependencies import get_current_user, require_admin
from app.services.notice_service import NoticeService
from app.services.notification_service import NotificationService


router = APIRouter(prefix="/notices", tags=["Notices"])


def get_notice_service(db: Session = Depends(get_db)):
    return NoticeService(
        repository=NoticeRepository(db),
        school_class_repository=SchoolClassRepository(db),
        student_repository=StudentRepository(db),
        teacher_repository=TeacherRepository(db),
        user_repository=UserRepository(db),
        notification_service=NotificationService(NotificationRepository(db))
    )


@router.post("", response_model=NoticeResponse)
def create_notice(
    data: NoticeCreateRequest,
    admin=Depends(require_admin),
    service: NoticeService = Depends(get_notice_service)
):
    try:
        return service.create(data.title, data.content, data.class_id, admin.id)
    except TurmaNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.get("", response_model=list[NoticeResponse])
def list_my_notices(
    current_user=Depends(get_current_user),
    service: NoticeService = Depends(get_notice_service)
):
    return service.list_visible_to(current_user)


@router.get("/{public_id}", response_model=NoticeResponse)
def get_notice(
    public_id: str,
    current_user=Depends(get_current_user),
    service: NoticeService = Depends(get_notice_service)
):
    try:
        return service.get_for_user(public_id, current_user)
    except AvisoNaoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except AcessoNegadoError as error:
        raise HTTPException(status_code=403, detail=str(error))


@router.delete("/{public_id}", status_code=204)
def delete_notice(
    public_id: str,
    admin=Depends(require_admin),
    service: NoticeService = Depends(get_notice_service)
):
    try:
        service.delete(public_id)
    except AvisoNaoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error))