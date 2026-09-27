import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


logger = logging.getLogger("app.errors")


class UnhandledExceptionMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except Exception:
            logger.exception("Erro não tratado em %s %s", request.method, request.url.path)
            return JSONResponse(status_code=500, content={"detail": "Erro interno do servidor"})