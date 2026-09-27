from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.exceptions.system_exceptions import ConsultaInvalidaError
from app.repositories.calendar_event_repository import CalendarEventRepository
from app.repositories.discipline_repository import DisciplineRepository
from app.repositories.notification_repository import NotificationRepository
from app.repositories.school_class_repository import SchoolClassRepository
from app.repositories.student_repository import StudentRepository
from app.repositories.teacher_repository import TeacherRepository
from app.schemas.system_schema import SearchResponse
from app.services.auth_dependencies import get_current_user
from app.services.dashboard_service import DashboardService
from app.services.search_service import SearchService


router = APIRouter(tags=["System"])


def get_search_service(db: Session = Depends(get_db)):
    return SearchService(
        student_repository=StudentRepository(db),
        teacher_repository=TeacherRepository(db),
        school_class_repository=SchoolClassRepository(db),
        discipline_repository=DisciplineRepository(db)
    )


def get_dashboard_service(db: Session = Depends(get_db)):
    return DashboardService(
        student_repository=StudentRepository(db),
        teacher_repository=TeacherRepository(db),
        school_class_repository=SchoolClassRepository(db),
        discipline_repository=DisciplineRepository(db),
        calendar_event_repository=CalendarEventRepository(db),
        notification_repository=NotificationRepository(db)
    )


@router.get("/search", response_model=SearchResponse)
def search(
    q: str,
    current_user=Depends(get_current_user),
    service: SearchService = Depends(get_search_service)
):
    try:
        return service.search(q)
    except ConsultaInvalidaError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.get("/dashboard")
def get_dashboard(
    current_user=Depends(get_current_user),
    service: DashboardService = Depends(get_dashboard_service)
):
    return service.get_dashboard(current_user)