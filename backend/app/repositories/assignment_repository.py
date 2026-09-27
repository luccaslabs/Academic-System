from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.assignment import Assignment


class AssignmentRepository:

    def __init__(self, db: Session):
        self.db = db

    def find_by_id(self, assignment_id: int):
        return self.db.scalar(select(Assignment).where(Assignment.id == assignment_id))

    def find_by_public_id(self, public_id: str):
        return self.db.scalar(select(Assignment).where(Assignment.public_id == public_id))

    def find_by_class(self, class_id: int):
        statement = select(Assignment).where(
            Assignment.class_id == class_id
        ).order_by(Assignment.due_date.asc())
        return list(self.db.scalars(statement))

    def find_visible_to(self, class_ids: list[int]):
        statement = select(Assignment).where(
            Assignment.class_id.in_(class_ids)
        ).order_by(Assignment.due_date.asc())
        return list(self.db.scalars(statement))

    def create(self, assignment: Assignment):
        self.db.add(assignment)
        self.db.commit()
        self.db.refresh(assignment)
        return assignment

    def update(self, assignment: Assignment):
        self.db.commit()
        self.db.refresh(assignment)
        return assignment

    def delete(self, assignment: Assignment):
        self.db.delete(assignment)
        self.db.commit()