from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.calendar_event import CalendarEvent


class CalendarEventRepository:

    def __init__(self, db: Session):
        self.db = db

    def find_by_id(self, event_id: int):
        return self.db.scalar(select(CalendarEvent).where(CalendarEvent.id == event_id))

    def find_by_public_id(self, public_id: str):
        return self.db.scalar(select(CalendarEvent).where(CalendarEvent.public_id == public_id))

    def find_visible_to(self, class_ids: list[int]):
        statement = select(CalendarEvent).where(
            (CalendarEvent.class_id.is_(None)) | (CalendarEvent.class_id.in_(class_ids))
        ).order_by(CalendarEvent.event_date.asc())
        return list(self.db.scalars(statement))

    def find_upcoming(self, class_ids: list[int], limit: int = 5):
        now = datetime.now(timezone.utc)
        statement = (
            select(CalendarEvent)
            .where(
                CalendarEvent.event_date >= now,
                (CalendarEvent.class_id.is_(None)) | (CalendarEvent.class_id.in_(class_ids))
            )
            .order_by(CalendarEvent.event_date.asc())
            .limit(limit)
        )
        return list(self.db.scalars(statement))

    def find_all(self):
        return list(self.db.scalars(select(CalendarEvent)))

    def create(self, event: CalendarEvent):
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def update(self, event: CalendarEvent):
        self.db.commit()
        self.db.refresh(event)
        return event

    def delete(self, event: CalendarEvent):
        self.db.delete(event)
        self.db.commit()