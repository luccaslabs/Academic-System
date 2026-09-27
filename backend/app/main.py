from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.responses import JSONResponse


#           |
#           |
#           |
#         \ | /
#       - - O - -
#         / | \
#
#  @developer Lucas


import app.models  
from app.config.settings import CORS_ORIGINS
from app.core.csrf import CSRFMiddleware
from app.core.rate_limiter import limiter
from app.core.security_headers import SecurityHeadersMiddleware

from app.controllers.auth_controller import router as auth_router
from app.controllers.user_controller import router as user_router
from app.controllers.discipline_controller import router as discipline_router
from app.controllers.teacher_controller import router as teacher_router
from app.controllers.student_controller import router as student_router
from app.controllers.school_class_controller import router as school_class_router
from app.controllers.enrollment_controller import router as enrollment_router
from app.controllers.notice_controller import router as notice_router
from app.controllers.notification_controller import router as notification_router
from app.controllers.calendar_controller import router as calendar_router
from app.controllers.system_controller import router as system_router
from app.controllers.grade_controller import router as grade_router
from app.controllers.attendance_controller import router as attendance_router
from app.controllers.assignment_controller import router as assignment_router
from app.controllers.submission_controller import router as submission_router


app = FastAPI()

app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    lambda request, exc: JSONResponse(
        status_code=429,
        content={"detail": "Muitas requisições, tente novamente em instantes"},
    ),
)

from app.core.error_handling import UnhandledExceptionMiddleware


app.add_middleware(UnhandledExceptionMiddleware)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(CSRFMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],
)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(discipline_router)
app.include_router(teacher_router)
app.include_router(student_router)
app.include_router(school_class_router)
app.include_router(enrollment_router)
app.include_router(notice_router)
app.include_router(notification_router)
app.include_router(calendar_router)
app.include_router(system_router)
app.include_router(grade_router)
app.include_router(attendance_router)
app.include_router(assignment_router)
app.include_router(submission_router)