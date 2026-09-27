from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.sql_utils import escape_like
from app.models.enrollment import Enrollment
from app.models.school_class import SchoolClass


class SchoolClassRepository:

    def __init__(self, db: Session):
        self.db = db

    def find_by_id(self, class_id: int):
        return self.db.scalar(select(SchoolClass).where(SchoolClass.id == class_id))

    def find_by_public_id(self, public_id: str):
        return self.db.scalar(select(SchoolClass).where(SchoolClass.public_id == public_id))

    def find_by_id_with_details(self, class_id: int):
        statement = (
            select(SchoolClass)
            .where(SchoolClass.id == class_id)
            .options(
                selectinload(SchoolClass.teacher),
                selectinload(SchoolClass.discipline),
                selectinload(SchoolClass.enrollments).selectinload(Enrollment.student),
            )
        )
        return self.db.scalar(statement)

    def find_by_public_id_with_details(self, public_id: str):
        statement = (
            select(SchoolClass)
            .where(SchoolClass.public_id == public_id)
            .options(
                selectinload(SchoolClass.teacher),
                selectinload(SchoolClass.discipline),
                selectinload(SchoolClass.enrollments).selectinload(Enrollment.student),
            )
        )
        return self.db.scalar(statement)

    def find_all(self):
        return list(self.db.scalars(select(SchoolClass)))

    def search(self, query: str):
        statement = select(SchoolClass).where(
            SchoolClass.name.ilike(f"%{escape_like(query)}%", escape="\\")
        )
        return list(self.db.scalars(statement))

    def create(self, school_class: SchoolClass):
        self.db.add(school_class)
        self.db.commit()
        self.db.refresh(school_class)
        return school_class

    def update(self, school_class: SchoolClass):
        self.db.commit()
        self.db.refresh(school_class)
        return school_class

    def delete(self, school_class: SchoolClass):
        self.db.delete(school_class)
        self.db.commit()