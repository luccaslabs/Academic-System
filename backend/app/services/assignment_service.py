from app.core.sanitize import strip_html
from app.exceptions.access_exceptions import AcessoNegadoError
from app.exceptions.academic_exceptions import TurmaNaoEncontradaError
from app.exceptions.tracking_exceptions import AtividadeNaoEncontradaError
from app.models.assignment import Assignment
from app.repositories.assignment_repository import AssignmentRepository
from app.repositories.school_class_repository import SchoolClassRepository
from app.repositories.student_repository import StudentRepository


class AssignmentService:

    def __init__(
        self,
        repository: AssignmentRepository,
        school_class_repository: SchoolClassRepository,
        student_repository: StudentRepository
    ):
        self.repository = repository
        self.school_class_repository = school_class_repository
        self.student_repository = student_repository

    def create(self, class_public_id, title, description, due_date, accepts_submissions, created_by: int):

        school_class = self.school_class_repository.find_by_public_id(class_public_id)
        if not school_class:
            raise TurmaNaoEncontradaError("Turma não encontrada")

        assignment = Assignment(
            class_id=school_class.id,
            title=strip_html(title),
            description=strip_html(description) if description else description,
            due_date=due_date,
            accepts_submissions=accepts_submissions,
            created_by=created_by
        )

        return self.repository.create(assignment)

    def get_by_public_id(self, public_id: str):
        assignment = self.repository.find_by_public_id(public_id)
        if not assignment:
            raise AtividadeNaoEncontradaError("Atividade não encontrada")
        return assignment

    def get_for_user(self, public_id: str, current_user):

        assignment = self.get_by_public_id(public_id)

        if current_user.role == "admin":
            return assignment

        student = self.student_repository.find_by_user_id(current_user.id)

        if student and any(enrollment.class_id == assignment.class_id for enrollment in student.enrollments):
            return assignment

        raise AcessoNegadoError("Acesso negado a essa atividade")

    def list_for_class(self, class_public_id: str):
        school_class = self.school_class_repository.find_by_public_id(class_public_id)
        if not school_class:
            raise TurmaNaoEncontradaError("Turma não encontrada")
        return self.repository.find_by_class(school_class.id)

    def list_visible_to(self, user_id: int):

        student = self.student_repository.find_by_user_id(user_id)
        if not student:
            return []

        class_ids = [enrollment.class_id for enrollment in student.enrollments]

        return self.repository.find_visible_to(class_ids)

    def update(self, public_id, title, description, due_date, accepts_submissions):

        assignment = self.get_by_public_id(public_id)

        if title is not None:
            assignment.title = strip_html(title)
        if description is not None:
            assignment.description = strip_html(description)
        if due_date is not None:
            assignment.due_date = due_date
        if accepts_submissions is not None:
            assignment.accepts_submissions = accepts_submissions

        return self.repository.update(assignment)

    def delete(self, public_id: str):
        assignment = self.get_by_public_id(public_id)
        self.repository.delete(assignment)