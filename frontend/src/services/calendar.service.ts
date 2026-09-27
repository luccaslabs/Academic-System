import { api } from './api'
import type { CalendarEventResponse, EventType } from '../types/api'

export const calendarService = {
  getEvents: async () => {
    return api.get<CalendarEventResponse[]>('/calendar')
  },

  getEvent: async (id: string) => {
    return api.get<CalendarEventResponse>(`/calendar/${id}`)
  },

  createEvent: async (data: {
    title: string
    description?: string | null
    event_type: EventType
    event_date: string
    class_id?: string | null
  }) => {
    return api.post<CalendarEventResponse>('/calendar', data)
  },

  updateEvent: async (
    id: string,
    data: {
      title?: string
      description?: string | null
      event_type?: EventType
      event_date?: string
    }
  ) => {
    return api.put<CalendarEventResponse>(`/calendar/${id}`, data)
  },

  deleteEvent: async (id: string) => {
    return api.delete<void>(`/calendar/${id}`)
  },
}
