from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.exceptions.tracking_exceptions import EntregaJaExistenteError
from app.models.submission import Submission


class SubmissionRepository:

    def __init__(self, db: Session):
        self.db = db

    def find_by_id(self, submission_id: int):
        return self.db.scalar(select(Submission).where(Submission.id == submission_id))

    def find_by_public_id(self, public_id: str):
        return self.db.scalar(select(Submission).where(Submission.public_id == public_id))

    def find_by_assignment_and_student(self, assignment_id: int, student_id: int):
        statement = select(Submission).where(
            Submission.assignment_id == assignment_id,
            Submission.student_id == student_id
        )
        return self.db.scalar(statement)

    def find_by_assignment(self, assignment_id: int):
        return list(self.db.scalars(select(Submission).where(Submission.assignment_id == assignment_id)))

    def create(self, submission: Submission):
        self.db.add(submission)
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise EntregaJaExistenteError("Você já enviou essa atividade")
        self.db.refresh(submission)
        return submission