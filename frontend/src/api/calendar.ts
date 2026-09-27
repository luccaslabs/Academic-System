import { api } from './client'
import type { CalendarEventResponse, EventType } from './types'

interface CalendarEventInput {
  title: string
  description?: string | null
  event_type: EventType
  event_date: string
  class_id?: string | null
}

export const calendarApi = {
  list: () => api.get<CalendarEventResponse[]>('/calendar'),
  get: (id: string) => api.get<CalendarEventResponse>(`/calendar/${id}`),
  create: (data: CalendarEventInput) => api.post<CalendarEventResponse>('/calendar', data),
  update: (id: string, data: Partial<CalendarEventInput>) =>
    api.put<CalendarEventResponse>(`/calendar/${id}`, data),
  delete: (id: string) => api.delete(`/calendar/${id}`),
}