from app.repositories.calendar_event_repository import CalendarEventRepository
from app.repositories.discipline_repository import DisciplineRepository
from app.repositories.notification_repository import NotificationRepository
from app.repositories.school_class_repository import SchoolClassRepository
from app.repositories.student_repository import StudentRepository
from app.repositories.teacher_repository import TeacherRepository


class DashboardService:

    def __init__(
        self,
        student_repository: StudentRepository,
        teacher_repository: TeacherRepository,
        school_class_repository: SchoolClassRepository,
        discipline_repository: DisciplineRepository,
        calendar_event_repository: CalendarEventRepository,
        notification_repository: NotificationRepository
    ):
        self.student_repository = student_repository
        self.teacher_repository = teacher_repository
        self.school_class_repository = school_class_repository
        self.discipline_repository = discipline_repository
        self.calendar_event_repository = calendar_event_repository
        self.notification_repository = notification_repository

    def get_dashboard(self, user):

        unread = self.notification_repository.count_unread(user.id)

        if user.role == "student":
            return self._student_dashboard(user, unread)

        if user.role == "teacher":
            return self._teacher_dashboard(user, unread)

        return self._admin_dashboard(unread)

    def _student_dashboard(self, user, unread: int):

        student = self.student_repository.find_by_user_id(user.id)
        class_ids = [enrollment.class_id for enrollment in student.enrollments] if student else []
        classes = [enrollment.school_class for enrollment in student.enrollments] if student else []

        return {
            "enrolled_classes": classes,
            "unread_notifications": unread,
            "upcoming_events": self.calendar_event_repository.find_upcoming(class_ids),
        }

    def _teacher_dashboard(self, user, unread: int):

        teacher = self.teacher_repository.find_by_user_id(user.id)
        class_ids = [school_class.id for school_class in teacher.classes] if teacher else []

        return {
            "teaching_classes": teacher.classes if teacher else [],
            "unread_notifications": unread,
            "upcoming_events": self.calendar_event_repository.find_upcoming(class_ids),
        }

    def _admin_dashboard(self, unread: int):

        return {
            "total_students": len(self.student_repository.find_all()),
            "total_teachers": len(self.teacher_repository.find_all()),
            "total_classes": len(self.school_class_repository.find_all()),
            "total_disciplines": len(self.discipline_repository.find_all()),
            "unread_notifications": unread,
        }