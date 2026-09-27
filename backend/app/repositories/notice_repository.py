from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.notice import Notice


class NoticeRepository:

    def __init__(self, db: Session):
        self.db = db

    def find_by_id(self, notice_id: int):
        return self.db.scalar(select(Notice).where(Notice.id == notice_id))

    def find_by_public_id(self, public_id: str):
        return self.db.scalar(select(Notice).where(Notice.public_id == public_id))

    def find_visible_to(self, class_ids: list[int]):
        statement = select(Notice).where(
            (Notice.class_id.is_(None)) | (Notice.class_id.in_(class_ids))
        )
        return list(self.db.scalars(statement))

    def find_all(self):
        return list(self.db.scalars(select(Notice)))

    def create(self, notice: Notice):
        self.db.add(notice)
        self.db.commit()
        self.db.refresh(notice)
        return notice

    def delete(self, notice: Notice):
        self.db.delete(notice)
        self.db.commit()