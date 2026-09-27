import uuid

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column


class PublicIdMixin:
    public_id: Mapped[str] = mapped_column(
        String(36),
        unique=True,
        index=True,
        default=lambda: str(uuid.uuid4()),
        nullable=False,
    )