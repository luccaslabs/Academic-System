from datetime import date

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.exceptions.tracking_exceptions import FrequenciaJaRegistradaError
from app.models.attendance import Attendance


class AttendanceRepository:

    def __init__(self, db: Session):
        self.db = db

    def find_by_id(self, attendance_id: int):
        return self.db.scalar(select(Attendance).where(Attendance.id == attendance_id))

    def find_by_public_id(self, public_id: str):
        return self.db.scalar(select(Attendance).where(Attendance.public_id == public_id))

    def find_by_enrollment_and_date(self, enrollment_id: int, class_date: date):
        statement = select(Attendance).where(
            Attendance.enrollment_id == enrollment_id,
            Attendance.class_date == class_date
        )
        return self.db.scalar(statement)

    def find_by_enrollment(self, enrollment_id: int):
        statement = select(Attendance).where(
            Attendance.enrollment_id == enrollment_id
        ).order_by(Attendance.class_date.asc())
        return list(self.db.scalars(statement))

    def create(self, attendance: Attendance):
        self.db.add(attendance)
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise FrequenciaJaRegistradaError("Frequência já registrada para essa data")
        self.db.refresh(attendance)
        return attendance

    def update(self, attendance: Attendance):
        self.db.commit()
        self.db.refresh(attendance)
        return attendance