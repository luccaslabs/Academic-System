from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field

from app.schemas.base import PublicIdResponse


class CalendarEventType(str, Enum):
    exam = "exam"
    assignment = "assignment"
    event = "event"


class CalendarEventCreateRequest(BaseModel):
    title: str
    description: str | None = None
    event_type: CalendarEventType
    event_date: datetime
    class_id: str | None = None


class CalendarEventUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    event_type: CalendarEventType | None = None
    event_date: datetime | None = None


class CalendarEventResponse(PublicIdResponse):
    title: str
    description: str | None
    event_type: CalendarEventType
    event_date: datetime
    created_at: datetime
    class_id: str | None = Field(validation_alias="class_public_id")
    created_by: str = Field(validation_alias="created_by_public_id")