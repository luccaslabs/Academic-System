from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.notification import Notification


class NotificationRepository:

    def __init__(self, db: Session):
        self.db = db

    def find_by_id(self, notification_id: int):
        return self.db.scalar(select(Notification).where(Notification.id == notification_id))

    def find_by_public_id(self, public_id: str):
        return self.db.scalar(select(Notification).where(Notification.public_id == public_id))

    def find_by_user(self, user_id: int):
        statement = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
        )
        return list(self.db.scalars(statement))

    def create_many(self, notifications: list[Notification]):
        self.db.add_all(notifications)
        self.db.commit()
        return notifications

    def update(self, notification: Notification):
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def count_unread(self, user_id: int) -> int:
        statement = select(func.count()).select_from(Notification).where(
            Notification.user_id == user_id,
            Notification.read.is_(False)
        )
        return self.db.scalar(statement)

    def count_unread_by_type(self, user_id: int) -> dict[str, int]:
        statement = (
            select(Notification.reference_type, func.count())
            .where(Notification.user_id == user_id, Notification.read.is_(False))
            .group_by(Notification.reference_type)
        )
        return {reference_type: count for reference_type, count in self.db.execute(statement)}

    def mark_all_as_read(self, user_id: int, reference_type: str):
        statement = select(Notification).where(
            Notification.user_id == user_id,
            Notification.reference_type == reference_type,
            Notification.read.is_(False)
        )
        notifications = list(self.db.scalars(statement))
        for notification in notifications:
            notification.read = True
        self.db.commit()
        return notifications