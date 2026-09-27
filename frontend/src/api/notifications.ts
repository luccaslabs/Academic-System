import { api } from './client'
import type { NotificationResponse } from './types'

export const notificationsApi = {
  list: () => api.get<NotificationResponse[]>('/notifications'),
  unreadSummary: () => api.get<Record<string, number>>('/notifications/unread-summary'),
  markRead: (id: string) => api.put<NotificationResponse>(`/notifications/${id}/read`),
  markAllRead: (referenceType: string) =>
    api.put<{ marked: boolean }>(`/notifications/read-all?reference_type=${referenceType}`),
}