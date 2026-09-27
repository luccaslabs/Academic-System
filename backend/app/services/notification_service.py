from app.exceptions.communication_exceptions import NotificacaoNaoEncontradaError
from app.models.notification import Notification
from app.repositories.notification_repository import NotificationRepository


class NotificationService:

    def __init__(self, repository: NotificationRepository):
        self.repository = repository

    def notify_users(self, user_ids: list[int], message: str, reference_type: str, reference_id: str):

        notifications = [
            Notification(
                user_id=user_id,
                message=message,
                reference_type=reference_type,
                reference_id=reference_id
            )
            for user_id in user_ids
        ]

        return self.repository.create_many(notifications)

    def list_for_user(self, user_id: int):
        return self.repository.find_by_user(user_id)

    def mark_as_read(self, public_id: str, user_id: int):

        notification = self.repository.find_by_public_id(public_id)

        if not notification or notification.user_id != user_id:
            raise NotificacaoNaoEncontradaError("Notificação não encontrada")

        notification.read = True

        return self.repository.update(notification)

    def unread_summary(self, user_id: int) -> dict[str, int]:
        return self.repository.count_unread_by_type(user_id)

    def mark_all_as_read(self, user_id: int, reference_type: str):
        return self.repository.mark_all_as_read(user_id, reference_type)