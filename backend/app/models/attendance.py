from datetime import date, datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base
from app.database.mixins import PublicIdMixin

if TYPE_CHECKING:
    from app.models.enrollment import Enrollment


class Attendance(Base, PublicIdMixin):
    __tablename__ = "attendances"
    __table_args__ = (UniqueConstraint("enrollment_id", "class_date", name="uq_enrollment_date"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    enrollment_id: Mapped[int] = mapped_column(ForeignKey("enrollments.id"), nullable=False)
    class_date: Mapped[date] = mapped_column(Date, nullable=False)
    present: Mapped[bool] = mapped_column(Boolean, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    enrollment: Mapped["Enrollment"] = relationship()

    @property
    def enrollment_public_id(self) -> str:
        return self.enrollment.public_id