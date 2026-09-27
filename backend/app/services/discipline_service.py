from app.exceptions.academic_exceptions import DisciplinaNaoEncontradaError
from app.models.discipline import Discipline
from app.repositories.discipline_repository import DisciplineRepository


class DisciplineService:

    def __init__(self, repository: DisciplineRepository):
        self.repository = repository

    def create(self, name: str, code: str):
        discipline = Discipline(name=name, code=code)
        return self.repository.create(discipline)

    def get_by_public_id(self, public_id: str):
        discipline = self.repository.find_by_public_id(public_id)
        if not discipline:
            raise DisciplinaNaoEncontradaError("Disciplina não encontrada")
        return discipline

    def list(self):
        return self.repository.find_all()

    def update(self, public_id: str, name: str | None, code: str | None):
        discipline = self.get_by_public_id(public_id)
        if name is not None:
            discipline.name = name
        if code is not None:
            discipline.code = code
        return self.repository.update(discipline)

    def delete(self, public_id: str):
        discipline = self.get_by_public_id(public_id)
        self.repository.delete(discipline)