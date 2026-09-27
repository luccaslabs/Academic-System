from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.grade import Grade


class GradeRepository:

    def __init__(self, db: Session):
        self.db = db

    def find_by_id(self, grade_id: int):
        return self.db.scalar(select(Grade).where(Grade.id == grade_id))

    def find_by_public_id(self, public_id: str):
        return self.db.scalar(select(Grade).where(Grade.public_id == public_id))

    def find_by_enrollment(self, enrollment_id: int):
        return list(self.db.scalars(select(Grade).where(Grade.enrollment_id == enrollment_id)))

    def create(self, grade: Grade):
        self.db.add(grade)
        self.db.commit()
        self.db.refresh(grade)
        return grade

    def update(self, grade: Grade):
        self.db.commit()
        self.db.refresh(grade)
        return grade

    def delete(self, grade: Grade):
        self.db.delete(grade)
        self.db.commit()