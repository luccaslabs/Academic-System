from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.base import PublicIdResponse


class NoticeCreateRequest(BaseModel):
    title: str
    content: str
    class_id: str | None = None


class NoticeResponse(PublicIdResponse):
    title: str
    content: str
    created_at: datetime
    class_id: str | None = Field(validation_alias="class_public_id")
    author_id: str = Field(validation_alias="author_public_id")


class NotificationResponse(PublicIdResponse):
    message: str
    reference_type: str
    reference_id: str
    read: bool
    created_at: datetime