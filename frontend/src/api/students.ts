import { api } from './client'
import type { StudentResponse } from './types'

interface StudentInput {
  user_id: string
  registration: string
}

export const studentsApi = {
  list: () => api.get<StudentResponse[]>('/students'),
  get: (id: string) => api.get<StudentResponse>(`/students/${id}`),
  create: (data: StudentInput) => api.post<StudentResponse>('/students', data),
  update: (id: string, data: Partial<Pick<StudentInput, 'registration'>>) =>
    api.put<StudentResponse>(`/students/${id}`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
}