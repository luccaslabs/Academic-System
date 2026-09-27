from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base
from app.database.mixins import PublicIdMixin

if TYPE_CHECKING:
    from app.models.school_class import SchoolClass
    from app.models.user import User


class Notice(Base, PublicIdMixin):
    __tablename__ = "notices"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    class_id: Mapped[int | None] = mapped_column(ForeignKey("school_classes.id"), nullable=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    class_: Mapped["SchoolClass | None"] = relationship()
    author: Mapped["User"] = relationship()

    @property
    def class_public_id(self) -> str | None:
        return self.class_.public_id if self.class_ else None

    @property
    def author_public_id(self) -> str:
        return self.author.public_id