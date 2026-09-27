from pydantic import BaseModel

from app.schemas.academic_schema import (
    DisciplineResponse,
    SchoolClassResponse,
    StudentResponse,
    TeacherResponse,
)
from app.schemas.calendar_schema import CalendarEventResponse


class SearchResponse(BaseModel):
    students: list[StudentResponse]
    teachers: list[TeacherResponse]
    classes: list[SchoolClassResponse]
    disciplines: list[DisciplineResponse]


class StudentDashboardResponse(BaseModel):
    enrolled_classes: list[SchoolClassResponse]
    unread_notifications: int
    upcoming_events: list[CalendarEventResponse]


class TeacherDashboardResponse(BaseModel):
    teaching_classes: list[SchoolClassResponse]
    unread_notifications: int
    upcoming_events: list[CalendarEventResponse]


class AdminDashboardResponse(BaseModel):
    total_students: int
    total_teachers: int
    total_classes: int
    total_disciplines: int
    unread_notifications: int