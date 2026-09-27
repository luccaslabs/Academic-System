from app.exceptions.access_exceptions import AcessoNegadoError
from app.exceptions.academic_exceptions import (
    DisciplinaNaoEncontradaError,
    ProfessorNaoEncontradoError,
    TurmaNaoEncontradaError,
)
from app.models.school_class import SchoolClass
from app.repositories.discipline_repository import DisciplineRepository
from app.repositories.school_class_repository import SchoolClassRepository
from app.repositories.student_repository import StudentRepository
from app.repositories.teacher_repository import TeacherRepository


class SchoolClassService:

    def __init__(
        self,
        repository: SchoolClassRepository,
        discipline_repository: DisciplineRepository,
        student_repository: StudentRepository,
        teacher_repository: TeacherRepository
    ):
        self.repository = repository
        self.discipline_repository = discipline_repository
        self.student_repository = student_repository
        self.teacher_repository = teacher_repository

    def create(self, name, year, discipline_public_id, teacher_public_id, passing_average):

        discipline = self.discipline_repository.find_by_public_id(discipline_public_id)
        if not discipline:
            raise DisciplinaNaoEncontradaError("Disciplina não encontrada")

        teacher = None
        if teacher_public_id:
            teacher = self.teacher_repository.find_by_public_id(teacher_public_id)
            if not teacher:
                raise ProfessorNaoEncontradoError("Professor não encontrado")

        school_class = SchoolClass(
            name=name,
            year=year,
            discipline_id=discipline.id,
            teacher_id=teacher.id if teacher else None,
            passing_average=passing_average
        )
        return self.repository.create(school_class)

    def get_by_public_id(self, public_id: str):
        school_class = self.repository.find_by_public_id(public_id)
        if not school_class:
            raise TurmaNaoEncontradaError("Turma não encontrada")
        return school_class

    def get_with_details_by_public_id(self, public_id: str):
        school_class = self.repository.find_by_public_id_with_details(public_id)
        if not school_class:
            raise TurmaNaoEncontradaError("Turma não encontrada")
        return school_class

    def list_for_user(self, current_user):

        if current_user.role == "admin":
            return self.repository.find_all()

        if current_user.role == "teacher":
            teacher = self.teacher_repository.find_by_user_id(current_user.id)
            return teacher.classes if teacher else []

        student = self.student_repository.find_by_user_id(current_user.id)
        if not student:
            return []
        return [enrollment.school_class for enrollment in student.enrollments]

    def update(self, public_id, name, year, teacher_public_id):

        school_class = self.get_by_public_id(public_id)

        if name is not None:
            school_class.name = name
        if year is not None:
            school_class.year = year
        if teacher_public_id is not None:
            teacher = self.teacher_repository.find_by_public_id(teacher_public_id)
            if not teacher:
                raise ProfessorNaoEncontradoError("Professor não encontrado")
            school_class.teacher_id = teacher.id

        return self.repository.update(school_class)

    def update_passing_average(self, public_id: str, passing_average: float, current_user):

        school_class = self.get_by_public_id(public_id)

        is_admin = current_user.role == "admin"
        is_class_teacher = (
            current_user.role == "teacher"
            and school_class.teacher
            and school_class.teacher.user_id == current_user.id
        )

        if not is_admin and not is_class_teacher:
            raise AcessoNegadoError("Apenas o professor da turma ou um administrador podem definir a média")

        school_class.passing_average = passing_average
        return self.repository.update(school_class)

    def delete(self, public_id: str):
        school_class = self.get_by_public_id(public_id)
        self.repository.delete(school_class)

    def get_with_details_for_user(self, public_id: str, current_user):

        school_class = self.get_with_details_by_public_id(public_id)

        if current_user.role == "admin":
            return school_class

        if school_class.teacher and school_class.teacher.user_id == current_user.id:
            return school_class

        student = self.student_repository.find_by_user_id(current_user.id)

        if student and any(enrollment.class_id == school_class.id for enrollment in student.enrollments):
            return school_class

        raise AcessoNegadoError("Acesso negado a essa turma")