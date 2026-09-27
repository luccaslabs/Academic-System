from datetime import date, datetime

from pydantic import BaseModel, Field

from app.schemas.base import PublicIdResponse


class GradeCreateRequest(BaseModel):
    enrollment_id: str
    value: float
    term: str
    description: str | None = None


class GradeUpdateRequest(BaseModel):
    value: float | None = None
    description: str | None = None


class GradeResponse(PublicIdResponse):
    value: float
    term: str
    description: str | None
    created_at: datetime
    enrollment_id: str = Field(validation_alias="enrollment_public_id")


class GradeAverageResponse(BaseModel):
    average: float | None
    passing_average: float
    below_average: bool


class AttendanceRegisterRequest(BaseModel):
    enrollment_id: str
    class_date: date
    present: bool


class AttendanceUpdateRequest(BaseModel):
    present: bool


class AttendanceResponse(PublicIdResponse):
    class_date: date
    present: bool
    created_at: datetime
    enrollment_id: str = Field(validation_alias="enrollment_public_id")


class AssignmentCreateRequest(BaseModel):
    class_id: str
    title: str
    description: str | None = None
    due_date: datetime
    accepts_submissions: bool = True


class AssignmentUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    due_date: datetime | None = None
    accepts_submissions: bool | None = None


class AssignmentResponse(PublicIdResponse):
    title: str
    description: str | None
    due_date: datetime
    accepts_submissions: bool
    created_at: datetime
    class_id: str = Field(validation_alias="class_public_id")
    created_by: str = Field(validation_alias="created_by_public_id")


class SubmissionCreateRequest(BaseModel):
    content: str


class SubmissionResponse(PublicIdResponse):
    content: str
    submitted_at: datetime
    assignment_id: str = Field(validation_alias="assignment_public_id")
    student_id: str = Field(validation_alias="student_public_id")