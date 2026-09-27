from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.sql_utils import escape_like
from app.models.student import Student
from app.models.user import User


class StudentRepository:

    def __init__(self, db: Session):
        self.db = db

    def find_by_id(self, student_id: int):
        return self.db.scalar(select(Student).where(Student.id == student_id))

    def find_by_public_id(self, public_id: str):
        return self.db.scalar(select(Student).where(Student.public_id == public_id))

    def find_by_user_id(self, user_id: int):
        return self.db.scalar(select(Student).where(Student.user_id == user_id))

    def find_all(self):
        return list(self.db.scalars(select(Student)))

    def search(self, query: str):
        statement = (
            select(Student)
            .join(User, Student.user_id == User.id)
            .where(User.name.ilike(f"%{escape_like(query)}%", escape="\\"))
        )
        return list(self.db.scalars(statement))

    def create(self, student: Student):
        self.db.add(student)
        self.db.commit()
        self.db.refresh(student)
        return student

    def update(self, student: Student):
        self.db.commit()
        self.db.refresh(student)
        return student

    def delete(self, student: Student):
        self.db.delete(student)
        self.db.commit()