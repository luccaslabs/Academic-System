from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base
from app.database.mixins import PublicIdMixin

if TYPE_CHECKING:
    from app.models.discipline import Discipline
    from app.models.enrollment import Enrollment
    from app.models.teacher import Teacher


class SchoolClass(Base, PublicIdMixin):
    __tablename__ = "school_classes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    year: Mapped[str] = mapped_column(String(9), nullable=False)
    passing_average: Mapped[float] = mapped_column(Float, default=6.0, nullable=False)

    discipline_id: Mapped[int] = mapped_column(ForeignKey("disciplines.id"), nullable=False)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("teachers.id"), nullable=True)

    discipline: Mapped["Discipline"] = relationship(back_populates="classes")
    teacher: Mapped["Teacher"] = relationship(back_populates="classes")
    enrollments: Mapped[list["Enrollment"]] = relationship(back_populates="school_class")

    @property
    def discipline_public_id(self) -> str:
        return self.discipline.public_id

    @property
    def teacher_public_id(self) -> str | None:
        return self.teacher.public_id if self.teacher else None