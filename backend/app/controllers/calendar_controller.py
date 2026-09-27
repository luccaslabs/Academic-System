from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.exceptions.access_exceptions import AcessoNegadoError
from app.exceptions.academic_exceptions import TurmaNaoEncontradaError
from app.exceptions.calendar_exceptions import EventoNaoEncontradoError
from app.repositories.calendar_event_repository import CalendarEventRepository
from app.repositories.notification_repository import NotificationRepository
from app.repositories.school_class_repository import SchoolClassRepository
from app.repositories.student_repository import StudentRepository
from app.repositories.teacher_repository import TeacherRepository
from app.repositories.user_repository import UserRepository
from app.schemas.calendar_schema import (
    CalendarEventCreateRequest,
    CalendarEventResponse,
    CalendarEventUpdateRequest,
)
from app.services.auth_dependencies import get_current_user, require_admin
from app.services.calendar_event_service import CalendarEventService
from app.services.notification_service import NotificationService


router = APIRouter(prefix="/calendar", tags=["Calendar"])


def get_calendar_event_service(db: Session = Depends(get_db)):
    return CalendarEventService(
        repository=CalendarEventRepository(db),
        school_class_repository=SchoolClassRepository(db),
        student_repository=StudentRepository(db),
        teacher_repository=TeacherRepository(db),
        user_repository=UserRepository(db),
        notification_service=NotificationService(NotificationRepository(db))
    )


@router.post("", response_model=CalendarEventResponse)
def create_event(
    data: CalendarEventCreateRequest,
    admin=Depends(require_admin),
    service: CalendarEventService = Depends(get_calendar_event_service)
):
    try:
        return service.create(
            data.title, data.description, data.event_type.value,
            data.event_date, data.class_id, admin.id
        )
    except TurmaNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.get("", response_model=list[CalendarEventResponse])
def list_my_events(
    current_user=Depends(get_current_user),
    service: CalendarEventService = Depends(get_calendar_event_service)
):
    return service.list_visible_to(current_user)


@router.get("/{public_id}", response_model=CalendarEventResponse)
def get_event(
    public_id: str,
    current_user=Depends(get_current_user),
    service: CalendarEventService = Depends(get_calendar_event_service)
):
    try:
        return service.get_for_user(public_id, current_user)
    except EventoNaoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except AcessoNegadoError as error:
        raise HTTPException(status_code=403, detail=str(error))


@router.put("/{public_id}", response_model=CalendarEventResponse)
def update_event(
    public_id: str,
    data: CalendarEventUpdateRequest,
    admin=Depends(require_admin),
    service: CalendarEventService = Depends(get_calendar_event_service)
):
    try:
        event_type = data.event_type.value if data.event_type else None
        return service.update(public_id, data.title, data.description, event_type, data.event_date)
    except EventoNaoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.delete("/{public_id}", status_code=204)
def delete_event(
    public_id: str,
    admin=Depends(require_admin),
    service: CalendarEventService = Depends(get_calendar_event_service)
):
    try:
        service.delete(public_id)
    except EventoNaoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error))