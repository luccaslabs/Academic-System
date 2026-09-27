from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


class CSRFMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):

        if request.method in UNSAFE_METHODS and "access_token" in request.cookies:

            cookie_token = request.cookies.get("csrf_token")
            header_token = request.headers.get("x-csrf-token")

            if not cookie_token or not header_token or cookie_token != header_token:
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Token CSRF inválido ou ausente"}
                )

        return await call_next(request)