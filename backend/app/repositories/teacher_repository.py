from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.sql_utils import escape_like
from app.models.teacher import Teacher
from app.models.user import User


class TeacherRepository:

    def __init__(self, db: Session):
        self.db = db

    def find_by_id(self, teacher_id: int):
        return self.db.scalar(select(Teacher).where(Teacher.id == teacher_id))

    def find_by_public_id(self, public_id: str):
        return self.db.scalar(select(Teacher).where(Teacher.public_id == public_id))

    def find_by_user_id(self, user_id: int):
        return self.db.scalar(select(Teacher).where(Teacher.user_id == user_id))

    def find_all(self):
        return list(self.db.scalars(select(Teacher)))

    def search(self, query: str):
        statement = (
            select(Teacher)
            .join(User, Teacher.user_id == User.id)
            .where(User.name.ilike(f"%{escape_like(query)}%", escape="\\"))
        )
        return list(self.db.scalars(statement))

    def create(self, teacher: Teacher):
        self.db.add(teacher)
        self.db.commit()
        self.db.refresh(teacher)
        return teacher

    def update(self, teacher: Teacher):
        self.db.commit()
        self.db.refresh(teacher)
        return teacher

    def delete(self, teacher: Teacher):
        self.db.delete(teacher)
        self.db.commit()