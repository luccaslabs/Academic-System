from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base
from app.database.mixins import PublicIdMixin

if TYPE_CHECKING:
    from app.models.enrollment import Enrollment
    from app.models.user import User


class Student(Base, PublicIdMixin):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    registration: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)

    user: Mapped["User"] = relationship()
    enrollments: Mapped[list["Enrollment"]] = relationship(back_populates="student")

    @property
    def user_public_id(self) -> str:
        return self.user.public_id