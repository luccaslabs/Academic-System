from app.core.sanitize import strip_html
from app.exceptions.access_exceptions import AcessoNegadoError
from app.exceptions.academic_exceptions import TurmaNaoEncontradaError
from app.exceptions.calendar_exceptions import EventoNaoEncontradoError
from app.models.calendar_event import CalendarEvent
from app.repositories.calendar_event_repository import CalendarEventRepository
from app.repositories.school_class_repository import SchoolClassRepository
from app.repositories.student_repository import StudentRepository
from app.repositories.teacher_repository import TeacherRepository
from app.repositories.user_repository import UserRepository
from app.services.notification_service import NotificationService


class CalendarEventService:

    def __init__(
        self,
        repository: CalendarEventRepository,
        school_class_repository: SchoolClassRepository,
        student_repository: StudentRepository,
        teacher_repository: TeacherRepository,
        user_repository: UserRepository,
        notification_service: NotificationService
    ):
        self.repository = repository
        self.school_class_repository = school_class_repository
        self.student_repository = student_repository
        self.teacher_repository = teacher_repository
        self.user_repository = user_repository
        self.notification_service = notification_service

    def create(self, title, description, event_type, event_date, class_public_id, created_by):

        class_id = None
        if class_public_id is not None:
            school_class = self.school_class_repository.find_by_public_id(class_public_id)
            if not school_class:
                raise TurmaNaoEncontradaError("Turma não encontrada")
            class_id = school_class.id

        event = CalendarEvent(
            title=strip_html(title),
            description=strip_html(description) if description else description,
            event_type=event_type,
            event_date=event_date,
            class_id=class_id,
            created_by=created_by
        )

        event = self.repository.create(event)
        event_id = event.id
        event_title = event.title
        event_public_id = event.public_id

        self.notification_service.notify_users(
            user_ids=self._resolve_recipients(class_id),
            message=f"Novo evento no calendário: {event_title}",
            reference_type="calendar_event",
            reference_id=event_public_id
        )

        return self.repository.find_by_id(event_id)

    def _resolve_recipients(self, class_id: int | None) -> list[int]:

        if class_id is None:
            return [user.id for user in self.user_repository.find_all()]

        school_class = self.school_class_repository.find_by_id_with_details(class_id)

        recipient_ids = [enrollment.student.user_id for enrollment in school_class.enrollments]

        if school_class.teacher_id:
            recipient_ids.append(school_class.teacher.user.id)

        return recipient_ids

    def get_by_public_id(self, public_id: str):
        event = self.repository.find_by_public_id(public_id)
        if not event:
            raise EventoNaoEncontradoError("Evento não encontrado")
        return event

    def get_for_user(self, public_id: str, current_user):
        event = self.get_by_public_id(public_id)
        self._check_visible(event, current_user)
        return event

    def _check_visible(self, event, current_user):

        if current_user.role == "admin":
            return

        if event.class_id is None:
            return

        if current_user.role == "teacher":
            teacher = self.teacher_repository.find_by_user_id(current_user.id)
            if teacher and any(school_class.id == event.class_id for school_class in teacher.classes):
                return
            raise AcessoNegadoError("Acesso negado a esse evento")

        student = self.student_repository.find_by_user_id(current_user.id)

        if student and any(enrollment.class_id == event.class_id for enrollment in student.enrollments):
            return

        raise AcessoNegadoError("Acesso negado a esse evento")

    def list_visible_to(self, current_user):

        if current_user.role == "admin":
            return self.repository.find_all()

        if current_user.role == "teacher":
            teacher = self.teacher_repository.find_by_user_id(current_user.id)
            class_ids = [school_class.id for school_class in teacher.classes] if teacher else []
            return self.repository.find_visible_to(class_ids)

        student = self.student_repository.find_by_user_id(current_user.id)
        class_ids = [enrollment.class_id for enrollment in student.enrollments] if student else []
        return self.repository.find_visible_to(class_ids)

    def update(self, public_id, title, description, event_type, event_date):

        event = self.get_by_public_id(public_id)

        if title is not None:
            event.title = strip_html(title)
        if description is not None:
            event.description = strip_html(description)
        if event_type is not None:
            event.event_type = event_type
        if event_date is not None:
            event.event_date = event_date

        return self.repository.update(event)

    def delete(self, public_id: str):
        event = self.get_by_public_id(public_id)
        self.repository.delete(event)