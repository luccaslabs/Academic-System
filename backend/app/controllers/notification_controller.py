from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.exceptions.communication_exceptions import NotificacaoNaoEncontradaError
from app.repositories.notification_repository import NotificationRepository
from app.schemas.communication_schema import NotificationResponse
from app.services.auth_dependencies import get_current_user
from app.services.notification_service import NotificationService


router = APIRouter(prefix="/notifications", tags=["Notifications"])


def get_notification_service(db: Session = Depends(get_db)):
    return NotificationService(NotificationRepository(db))


@router.get("", response_model=list[NotificationResponse])
def list_my_notifications(
    current_user=Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service)
):
    return service.list_for_user(current_user.id)


@router.get("/unread-summary", response_model=dict[str, int])
def get_unread_summary(
    current_user=Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service)
):
    return service.unread_summary(current_user.id)


@router.put("/read-all")
def mark_all_read(
    reference_type: str,
    current_user=Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service)
):
    service.mark_all_as_read(current_user.id, reference_type)
    return {"marked": True}


@router.put("/{public_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    public_id: str,
    current_user=Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service)
):
    try:
        return service.mark_as_read(public_id, current_user.id)
    except NotificacaoNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))