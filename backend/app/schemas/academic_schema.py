from pydantic import BaseModel, Field

from app.schemas.base import PublicIdResponse

class UserSummaryResponse(BaseModel):
    id: str
    name: str
    email: str


class DisciplineCreateRequest(BaseModel):
    name: str
    code: str


class DisciplineUpdateRequest(BaseModel):
    name: str | None = None
    code: str | None = None


class DisciplineResponse(PublicIdResponse):
    name: str
    code: str


class TeacherCreateRequest(BaseModel):
    user_id: str
    registration: str


class TeacherUpdateRequest(BaseModel):
    registration: str | None = None


class TeacherResponse(PublicIdResponse):
    registration: str
    user_id: str = Field(validation_alias="user_public_id")


class StudentCreateRequest(BaseModel):
    user_id: str
    registration: str


class StudentUpdateRequest(BaseModel):
    registration: str | None = None


class StudentResponse(PublicIdResponse):
    registration: str
    user_id: str = Field(validation_alias="user_public_id")

class StudentEnrollmentResponse(PublicIdResponse):
    registration: str
    user_id: str = Field(validation_alias="user_public_id")
    enrollment_id: str
    user: UserSummaryResponse


class SchoolClassCreateRequest(BaseModel):
    name: str
    year: str
    discipline_id: str
    teacher_id: str | None = None
    passing_average: float = 6.0


class SchoolClassUpdateRequest(BaseModel):
    name: str | None = None
    year: str | None = None
    teacher_id: str | None = None

class SchoolClassPassingAverageUpdateRequest(BaseModel):
    passing_average: float


class SchoolClassResponse(PublicIdResponse):
    name: str
    year: str
    passing_average: float
    discipline_id: str = Field(validation_alias="discipline_public_id")
    teacher_id: str | None = Field(validation_alias="teacher_public_id")


class SchoolClassDetailResponse(PublicIdResponse):
    name: str
    year: str
    passing_average: float
    discipline: DisciplineResponse
    teacher: TeacherResponse | None
    students: list[StudentEnrollmentResponse]


class EnrollmentCreateRequest(BaseModel):
    student_id: str
    class_id: str


class EnrollmentResponse(PublicIdResponse):
    student_id: str = Field(validation_alias="student_public_id")
    class_id: str = Field(validation_alias="class_public_id")