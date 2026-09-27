from enum import Enum

from pydantic import BaseModel, EmailStr

from app.schemas.base import PublicIdResponse


class UserRole(str, Enum):
    student = "student"
    teacher = "teacher"
    admin = "admin"


class UserResponse(PublicIdResponse):
    name: str
    email: EmailStr
    role: UserRole


class UserUpdateRequest(BaseModel):
    name: str | None = None
    email: EmailStr | None = None


class UserRoleUpdateRequest(BaseModel):
    role: UserRole