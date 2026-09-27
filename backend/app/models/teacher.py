from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base
from app.database.mixins import PublicIdMixin

if TYPE_CHECKING:
    from app.models.school_class import SchoolClass
    from app.models.user import User


class Teacher(Base, PublicIdMixin):
    __tablename__ = "teachers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    registration: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)

    user: Mapped["User"] = relationship()
    classes: Mapped[list["SchoolClass"]] = relationship(back_populates="teacher")

    @property
    def user_public_id(self) -> str:
        return self.user.public_id