from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.exceptions.auth_exceptions import EmailJaCadastradoError
from app.models.user import User


class UserRepository:

    def __init__(self, db: Session):
        self.db = db

    def find_by_email(self, email: str):
        return self.db.scalar(select(User).where(User.email == email))

    def find_by_id(self, user_id: int):
        return self.db.scalar(select(User).where(User.id == user_id))

    def find_by_public_id(self, public_id: str):
        return self.db.scalar(select(User).where(User.public_id == public_id))

    def find_all(self):
        return list(self.db.scalars(select(User)))

    def create(self, user: User):
        self.db.add(user)
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise EmailJaCadastradoError("E-mail já cadastrado")
        self.db.refresh(user)
        return user

    def update(self, user: User):
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise EmailJaCadastradoError("E-mail já cadastrado")
        self.db.refresh(user)
        return user

    def delete(self, user: User):
        self.db.delete(user)
        self.db.commit()