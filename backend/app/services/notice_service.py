from app.core.sanitize import strip_html
from app.exceptions.access_exceptions import AcessoNegadoError
from app.exceptions.academic_exceptions import TurmaNaoEncontradaError
from app.exceptions.communication_exceptions import AvisoNaoEncontradoError
from app.models.notice import Notice
from app.repositories.notice_repository import NoticeRepository
from app.repositories.school_class_repository import SchoolClassRepository
from app.repositories.student_repository import StudentRepository
from app.repositories.teacher_repository import TeacherRepository
from app.repositories.user_repository import UserRepository
from app.services.notification_service import NotificationService


class NoticeService:

    def __init__(
        self,
        repository: NoticeRepository,
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

    def create(self, title: str, content: str, class_public_id: str | None, author_id: int):

        class_id = None
        if class_public_id is not None:
            school_class = self.school_class_repository.find_by_public_id(class_public_id)
            if not school_class:
                raise TurmaNaoEncontradaError("Turma não encontrada")
            class_id = school_class.id

        notice = Notice(
            title=strip_html(title),
            content=strip_html(content),
            class_id=class_id,
            author_id=author_id
        )

        notice = self.repository.create(notice)
        notice_id = notice.id
        notice_title = notice.title
        notice_public_id = notice.public_id

        recipient_ids = self._resolve_recipients(class_id)

        self.notification_service.notify_users(
            user_ids=recipient_ids,
            message=f"Novo aviso: {notice_title}",
            reference_type="notice",
            reference_id=notice_public_id
        )

        return self.repository.find_by_id(notice_id)

    def _resolve_recipients(self, class_id: int | None) -> list[int]:

        if class_id is None:
            return [user.id for user in self.user_repository.find_all()]

        school_class = self.school_class_repository.find_by_id_with_details(class_id)

        recipient_ids = [
            enrollment.student.user_id for enrollment in school_class.enrollments
        ]

        if school_class.teacher_id:
            recipient_ids.append(school_class.teacher.user.id)

        return recipient_ids

    def get_by_public_id(self, public_id: str):
        notice = self.repository.find_by_public_id(public_id)
        if not notice:
            raise AvisoNaoEncontradoError("Aviso não encontrado")
        return notice

    def get_for_user(self, public_id: str, current_user):
        notice = self.get_by_public_id(public_id)
        self._check_visible(notice, current_user)
        return notice

    def _check_visible(self, notice, current_user):

        if current_user.role == "admin":
            return

        if notice.class_id is None:
            return

        if current_user.role == "teacher":
            teacher = self.teacher_repository.find_by_user_id(current_user.id)
            if teacher and any(school_class.id == notice.class_id for school_class in teacher.classes):
                return
            raise AcessoNegadoError("Acesso negado a esse aviso")

        student = self.student_repository.find_by_user_id(current_user.id)

        if student and any(enrollment.class_id == notice.class_id for enrollment in student.enrollments):
            return

        raise AcessoNegadoError("Acesso negado a esse aviso")

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

    def delete(self, public_id: str):
        notice = self.get_by_public_id(public_id)
        self.repository.delete(notice)