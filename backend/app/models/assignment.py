from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base
from app.database.mixins import PublicIdMixin

if TYPE_CHECKING:
    from app.models.school_class import SchoolClass
    from app.models.user import User


class Assignment(Base, PublicIdMixin):
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    class_id: Mapped[int] = mapped_column(ForeignKey("school_classes.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    accepts_submissions: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    class_: Mapped["SchoolClass"] = relationship()
    creator: Mapped["User"] = relationship()

    @property
    def class_public_id(self) -> str:
        return self.class_.public_id

    @property
    def created_by_public_id(self) -> str:
        return self.creator.public_id