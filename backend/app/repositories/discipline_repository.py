from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.sql_utils import escape_like
from app.models.discipline import Discipline


class DisciplineRepository:

    def __init__(self, db: Session):
        self.db = db

    def find_by_id(self, discipline_id: int):
        return self.db.scalar(select(Discipline).where(Discipline.id == discipline_id))

    def find_by_public_id(self, public_id: str):
        return self.db.scalar(select(Discipline).where(Discipline.public_id == public_id))

    def find_all(self):
        return list(self.db.scalars(select(Discipline)))

    def search(self, query: str):
        escaped = escape_like(query)
        statement = select(Discipline).where(
            Discipline.name.ilike(f"%{escaped}%", escape="\\")
            | Discipline.code.ilike(f"%{escaped}%", escape="\\")
        )
        return list(self.db.scalars(statement))

    def create(self, discipline: Discipline):
        self.db.add(discipline)
        self.db.commit()
        self.db.refresh(discipline)
        return discipline

    def update(self, discipline: Discipline):
        self.db.commit()
        self.db.refresh(discipline)
        return discipline

    def delete(self, discipline: Discipline):
        self.db.delete(discipline)
        self.db.commit()