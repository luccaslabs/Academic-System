from app.exceptions.access_exceptions import AcessoNegadoError
from app.exceptions.academic_exceptions import MatriculaNaoEncontradaError
from app.exceptions.tracking_exceptions import NotaNaoEncontradaError
from app.models.grade import Grade
from app.repositories.enrollment_repository import EnrollmentRepository
from app.repositories.grade_repository import GradeRepository


class GradeService:

    def __init__(self, repository: GradeRepository, enrollment_repository: EnrollmentRepository):
        self.repository = repository
        self.enrollment_repository = enrollment_repository

    def create(self, enrollment_public_id: str, value: float, term: str, description: str | None):

        enrollment = self.enrollment_repository.find_by_public_id(enrollment_public_id)
        if not enrollment:
            raise MatriculaNaoEncontradaError("Matrícula não encontrada")

        grade = Grade(enrollment_id=enrollment.id, value=value, term=term, description=description)

        return self.repository.create(grade)

    def list_for_enrollment(self, enrollment_public_id: str, current_user):

        enrollment = self.enrollment_repository.find_by_public_id(enrollment_public_id)
        if not enrollment:
            raise MatriculaNaoEncontradaError("Matrícula não encontrada")

        self._check_ownership(enrollment, current_user)

        return self.repository.find_by_enrollment(enrollment.id)

    def get_average_for_enrollment(self, enrollment_public_id: str, current_user):

        enrollment = self.enrollment_repository.find_by_public_id(enrollment_public_id)
        if not enrollment:
            raise MatriculaNaoEncontradaError("Matrícula não encontrada")

        self._check_ownership(enrollment, current_user)

        grades = self.repository.find_by_enrollment(enrollment.id)
        passing_average = enrollment.school_class.passing_average

        if not grades:
            return {"average": None, "passing_average": passing_average, "below_average": False}

        average = sum(grade.value for grade in grades) / len(grades)

        return {
            "average": average,
            "passing_average": passing_average,
            "below_average": average < passing_average,
        }

    def get_by_public_id(self, public_id: str):
        grade = self.repository.find_by_public_id(public_id)
        if not grade:
            raise NotaNaoEncontradaError("Nota não encontrada")
        return grade

    def update(self, public_id: str, value: float | None, description: str | None):

        grade = self.get_by_public_id(public_id)

        if value is not None:
            grade.value = value
        if description is not None:
            grade.description = description

        return self.repository.update(grade)

    def delete(self, public_id: str):
        grade = self.get_by_public_id(public_id)
        self.repository.delete(grade)

    def _check_ownership(self, enrollment, current_user):

        if current_user.role == "admin":
            return

        if enrollment.student.user_id != current_user.id:
            raise AcessoNegadoError("Acesso negado a essa matrícula")