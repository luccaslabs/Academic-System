import { api } from './client'
import type { GradeResponse } from './types'

interface GradeInput {
  enrollment_id: string
  value: number
  term: string
  description?: string | null
}

interface GradeAverage {
  average: number | null
  passing_average: number
  below_average: boolean
}

export const gradesApi = {
  listByEnrollment: (enrollmentId: string) => api.get<GradeResponse[]>(`/grades/enrollment/${enrollmentId}`),
  averageByEnrollment: (enrollmentId: string) =>
    api.get<GradeAverage>(`/grades/enrollment/${enrollmentId}/average`),
  create: (data: GradeInput) => api.post<GradeResponse>('/grades', data),
  update: (id: string, data: Partial<Pick<GradeInput, 'value' | 'description'>>) =>
    api.put<GradeResponse>(`/grades/${id}`, data),
  delete: (id: string) => api.delete(`/grades/${id}`),
}