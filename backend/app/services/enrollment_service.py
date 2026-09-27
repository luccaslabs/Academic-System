from app.exceptions.academic_exceptions import (
    AlunoNaoEncontradoError,
    MatriculaJaExistenteError,
    MatriculaNaoEncontradaError,
    TurmaNaoEncontradaError,
)
from app.models.enrollment import Enrollment
from app.repositories.enrollment_repository import EnrollmentRepository
from app.repositories.school_class_repository import SchoolClassRepository
from app.repositories.student_repository import StudentRepository


class EnrollmentService:

    def __init__(
        self,
        repository: EnrollmentRepository,
        student_repository: StudentRepository,
        school_class_repository: SchoolClassRepository
    ):
        self.repository = repository
        self.student_repository = student_repository
        self.school_class_repository = school_class_repository

    def enroll(self, student_public_id: str, class_public_id: str):

        student = self.student_repository.find_by_public_id(student_public_id)
        if not student:
            raise AlunoNaoEncontradoError("Aluno não encontrado")

        school_class = self.school_class_repository.find_by_public_id(class_public_id)
        if not school_class:
            raise TurmaNaoEncontradaError("Turma não encontrada")

        existing = self.repository.find_by_student_and_class(student.id, school_class.id)
        if existing:
            raise MatriculaJaExistenteError("Aluno já matriculado nessa turma")

        enrollment = Enrollment(student_id=student.id, class_id=school_class.id)
        return self.repository.create(enrollment)

    def unenroll(self, public_id: str):
        enrollment = self.repository.find_by_public_id(public_id)
        if not enrollment:
            raise MatriculaNaoEncontradaError("Matrícula não encontrada")
        self.repository.delete(enrollment)