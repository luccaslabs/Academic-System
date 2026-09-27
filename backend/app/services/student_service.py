from app.exceptions.academic_exceptions import AlunoNaoEncontradoError
from app.exceptions.auth_exceptions import UsuarioNaoEncontradoError
from app.models.student import Student
from app.repositories.student_repository import StudentRepository
from app.repositories.user_repository import UserRepository


class StudentService:

    def __init__(self, repository: StudentRepository, user_repository: UserRepository):
        self.repository = repository
        self.user_repository = user_repository

    def create(self, user_public_id: str, registration: str):
        user = self.user_repository.find_by_public_id(user_public_id)
        if not user:
            raise UsuarioNaoEncontradoError("Usuário não encontrado")
        student = Student(user_id=user.id, registration=registration)
        return self.repository.create(student)

    def get_by_public_id(self, public_id: str):
        student = self.repository.find_by_public_id(public_id)
        if not student:
            raise AlunoNaoEncontradoError("Aluno não encontrado")
        return student

    def list(self):
        return self.repository.find_all()

    def update(self, public_id: str, registration: str | None):
        student = self.get_by_public_id(public_id)
        if registration is not None:
            student.registration = registration
        return self.repository.update(student)

    def delete(self, public_id: str):
        student = self.get_by_public_id(public_id)
        self.repository.delete(student)