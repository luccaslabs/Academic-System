from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base
from app.database.mixins import PublicIdMixin

if TYPE_CHECKING:
    from app.models.school_class import SchoolClass


class Discipline(Base, PublicIdMixin):
    __tablename__ = "disciplines"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    classes: Mapped[list["SchoolClass"]] = relationship(back_populates="discipline")