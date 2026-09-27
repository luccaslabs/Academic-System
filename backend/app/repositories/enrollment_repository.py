from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.exceptions.academic_exceptions import MatriculaJaExistenteError
from app.models.enrollment import Enrollment


class EnrollmentRepository:

    def __init__(self, db: Session):
        self.db = db

    def find_by_student_and_class(self, student_id: int, class_id: int):
        statement = select(Enrollment).where(
            Enrollment.student_id == student_id,
            Enrollment.class_id == class_id
        )
        return self.db.scalar(statement)

    def find_by_id(self, enrollment_id: int):
        return self.db.scalar(select(Enrollment).where(Enrollment.id == enrollment_id))

    def find_by_public_id(self, public_id: str):
        return self.db.scalar(select(Enrollment).where(Enrollment.public_id == public_id))

    def create(self, enrollment: Enrollment):
        self.db.add(enrollment)
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise MatriculaJaExistenteError("Aluno já matriculado nessa turma")
        self.db.refresh(enrollment)
        return enrollment

    def delete(self, enrollment: Enrollment):
        self.db.delete(enrollment)
        self.db.commit()