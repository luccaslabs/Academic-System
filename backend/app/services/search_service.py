from app.exceptions.system_exceptions import ConsultaInvalidaError
from app.repositories.discipline_repository import DisciplineRepository
from app.repositories.school_class_repository import SchoolClassRepository
from app.repositories.student_repository import StudentRepository
from app.repositories.teacher_repository import TeacherRepository


class SearchService:

    def __init__(
        self,
        student_repository: StudentRepository,
        teacher_repository: TeacherRepository,
        school_class_repository: SchoolClassRepository,
        discipline_repository: DisciplineRepository
    ):
        self.student_repository = student_repository
        self.teacher_repository = teacher_repository
        self.school_class_repository = school_class_repository
        self.discipline_repository = discipline_repository

    def search(self, query: str):

        if len(query.strip()) < 2:
            raise ConsultaInvalidaError("A busca precisa ter ao menos 2 caracteres")

        return {
            "students": self.student_repository.search(query),
            "teachers": self.teacher_repository.search(query),
            "classes": self.school_class_repository.search(query),
            "disciplines": self.discipline_repository.search(query),
        }

    def get_by_public_id(self, public_id: str):
        obj = self.repository.find_by_public_id(public_id)
        if not obj:
            raise ConsultaInvalidaError("A busca precisa ter ao menos 2 caracteres")
        return obj