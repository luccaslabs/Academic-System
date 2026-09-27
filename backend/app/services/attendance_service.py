from app.exceptions.access_exceptions import AcessoNegadoError
from app.exceptions.academic_exceptions import MatriculaNaoEncontradaError
from app.exceptions.tracking_exceptions import FrequenciaNaoEncontradaError
from app.models.attendance import Attendance
from app.repositories.attendance_repository import AttendanceRepository
from app.repositories.enrollment_repository import EnrollmentRepository


class AttendanceService:

    def __init__(self, repository: AttendanceRepository, enrollment_repository: EnrollmentRepository):
        self.repository = repository
        self.enrollment_repository = enrollment_repository

    def register(self, enrollment_public_id: str, class_date, present: bool):

        enrollment = self.enrollment_repository.find_by_public_id(enrollment_public_id)
        if not enrollment:
            raise MatriculaNaoEncontradaError("Matrícula não encontrada")

        attendance = Attendance(enrollment_id=enrollment.id, class_date=class_date, present=present)

        return self.repository.create(attendance)

    def update(self, public_id: str, present: bool):

        attendance = self.repository.find_by_public_id(public_id)
        if not attendance:
            raise FrequenciaNaoEncontradaError("Frequência não encontrada")

        attendance.present = present

        return self.repository.update(attendance)

    def list_for_enrollment(self, enrollment_public_id: str, current_user):

        enrollment = self.enrollment_repository.find_by_public_id(enrollment_public_id)
        if not enrollment:
            raise MatriculaNaoEncontradaError("Matrícula não encontrada")

        self._check_ownership(enrollment, current_user)

        return self.repository.find_by_enrollment(enrollment.id)

    def _check_ownership(self, enrollment, current_user):

        if current_user.role == "admin":
            return

        if enrollment.student.user_id != current_user.id:
            raise AcessoNegadoError("Acesso negado a essa matrícula")