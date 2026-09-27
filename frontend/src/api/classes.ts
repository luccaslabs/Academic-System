import { api } from './client'
import type { SchoolClassDetailResponse, SchoolClassResponse } from './types'

interface SchoolClassInput {
  name: string
  year: string
  discipline_id: string
  teacher_id?: string | null
  passing_average?: number
}

export const classesApi = {
  list: () => api.get<SchoolClassResponse[]>('/classes'),
  get: (id: string) => api.get<SchoolClassDetailResponse>(`/classes/${id}`),
  create: (data: SchoolClassInput) => api.post<SchoolClassResponse>('/classes', data),
  update: (id: string, data: Partial<Omit<SchoolClassInput, 'discipline_id' | 'passing_average'>>) =>
    api.put<SchoolClassResponse>(`/classes/${id}`, data),
  updatePassingAverage: (id: string, passingAverage: number) =>
    api.put<SchoolClassResponse>(`/classes/${id}/passing-average`, { passing_average: passingAverage }),
  delete: (id: string) => api.delete(`/classes/${id}`),
}