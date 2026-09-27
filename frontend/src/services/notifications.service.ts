import { api } from './api'
import type { NotificationResponse, UnreadSummaryResponse } from '../types/api'

export const notificationsService = {
  getNotifications: async () => {
    return api.get<NotificationResponse[]>('/notifications')
  },

  markAsRead: async (id: string) => {
    return api.put<NotificationResponse>(`/notifications/${id}/read`)
  },

  getUnreadSummary: async () => {
    return api.get<UnreadSummaryResponse>('/notifications/unread-summary')
  },

  markAllRead: async (referenceType: 'notice' | 'calendar_event') => {
    return api.put<void>(`/notifications/read-all`, undefined, {
      params: { reference_type: referenceType },
    })
  },
}
