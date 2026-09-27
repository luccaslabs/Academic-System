import { api } from './client'
import type { NoticeResponse } from './types'

interface NoticeInput {
  title: string
  content: string
  class_id?: string | null
}

export const noticesApi = {
  list: () => api.get<NoticeResponse[]>('/notices'),
  get: (id: string) => api.get<NoticeResponse>(`/notices/${id}`),
  create: (data: NoticeInput) => api.post<NoticeResponse>('/notices', data),
  delete: (id: string) => api.delete(`/notices/${id}`),
}