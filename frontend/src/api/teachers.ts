import { api } from './client'
import type { TeacherResponse } from './types'

interface TeacherInput {
  user_id: string
  registration: string
}

export const teachersApi = {
  list: () => api.get<TeacherResponse[]>('/teachers'),
  get: (id: string) => api.get<TeacherResponse>(`/teachers/${id}`),
  create: (data: TeacherInput) => api.post<TeacherResponse>('/teachers', data),
  update: (id: string, data: Partial<Pick<TeacherInput, 'registration'>>) =>
    api.put<TeacherResponse>(`/teachers/${id}`, data),
  delete: (id: string) => api.delete(`/teachers/${id}`),
}