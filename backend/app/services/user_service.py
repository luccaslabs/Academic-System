from app.exceptions.auth_exceptions import UsuarioNaoEncontradoError
from app.repositories.user_repository import UserRepository


class UserService:

    def __init__(self, repository: UserRepository):
        self.repository = repository

    def get_by_public_id(self, public_id: str):
        user = self.repository.find_by_public_id(public_id)
        if not user:
            raise UsuarioNaoEncontradoError("Usuário não encontrado")
        return user

    def update_profile(self, user_id: int, name: str | None, email: str | None):

        user = self.repository.find_by_id(user_id)
        if not user:
            raise UsuarioNaoEncontradoError("Usuário não encontrado")

        if name is not None:
            user.name = name
        if email is not None:
            user.email = email

        return self.repository.update(user)

    def list_users(self):
        return self.repository.find_all()

    def update_role(self, user_id: int, role):
        user = self.repository.find_by_id(user_id)
        if not user:
            raise UsuarioNaoEncontradoError("Usuário não encontrado")
        user.role = role
        return self.repository.update(user)

    def delete_user(self, user_id: int):
        user = self.repository.find_by_id(user_id)
        if not user:
            raise UsuarioNaoEncontradoError("Usuário não encontrado")
        self.repository.delete(user)