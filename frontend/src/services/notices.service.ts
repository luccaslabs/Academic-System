import { api } from './api'
import type { NoticeResponse } from '../types/api'

export const noticesService = {
  getNotices: async () => {
    return api.get<NoticeResponse[]>('/notices')
  },

  getNotice: async (id: string) => {
    return api.get<NoticeResponse>(`/notices/${id}`)
  },

  createNotice: async (data: {
    title: string
    content: string
    class_id?: string | null
  }) => {
    return api.post<NoticeResponse>('/notices', data)
  },

  deleteNotice: async (id: string) => {
    return api.delete<void>(`/notices/${id}`)
  },
}
