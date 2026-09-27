from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base
from app.database.mixins import PublicIdMixin

if TYPE_CHECKING:
    from app.models.school_class import SchoolClass
    from app.models.student import Student


class Enrollment(Base, PublicIdMixin):
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("student_id", "class_id", name="uq_student_class"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), nullable=False)
    class_id: Mapped[int] = mapped_column(ForeignKey("school_classes.id"), nullable=False)

    student: Mapped["Student"] = relationship(back_populates="enrollments")
    school_class: Mapped["SchoolClass"] = relationship(back_populates="enrollments")

    @property
    def student_public_id(self) -> str:
        return self.student.public_id

    @property
    def class_public_id(self) -> str:
        return self.school_class.public_id