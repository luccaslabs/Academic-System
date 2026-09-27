from app.exceptions.academic_exceptions import ProfessorNaoEncontradoError
from app.exceptions.auth_exceptions import UsuarioNaoEncontradoError
from app.models.teacher import Teacher
from app.repositories.teacher_repository import TeacherRepository
from app.repositories.user_repository import UserRepository


class TeacherService:

    def __init__(self, repository: TeacherRepository, user_repository: UserRepository):
        self.repository = repository
        self.user_repository = user_repository

    def create(self, user_public_id: str, registration: str):
        user = self.user_repository.find_by_public_id(user_public_id)
        if not user:
            raise UsuarioNaoEncontradoError("Usuário não encontrado")
        teacher = Teacher(user_id=user.id, registration=registration)
        return self.repository.create(teacher)

    def get_by_public_id(self, public_id: str):
        teacher = self.repository.find_by_public_id(public_id)
        if not teacher:
            raise ProfessorNaoEncontradoError("Professor não encontrado")
        return teacher

    def list(self):
        return self.repository.find_all()

    def update(self, public_id: str, registration: str | None):
        teacher = self.get_by_public_id(public_id)
        if registration is not None:
            teacher.registration = registration
        return self.repository.update(teacher)

    def delete(self, public_id: str):
        teacher = self.get_by_public_id(public_id)
        self.repository.delete(teacher)