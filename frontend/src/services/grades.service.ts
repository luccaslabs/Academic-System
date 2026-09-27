import { api } from './api'
import type { GradeResponse, EnrollmentAverageResponse } from '../types/api'

export const gradesService = {
  getGradesByEnrollment: async (enrollmentId: string) => {
    return api.get<GradeResponse[]>(`/grades/enrollment/${enrollmentId}`)
  },

  getAverageByEnrollment: async (enrollmentId: string) => {
    return api.get<EnrollmentAverageResponse>(`/grades/enrollment/${enrollmentId}/average`)
  },

  createGrade: async (data: {
    enrollment_id: string
    value: number
    term: string
    description?: string | null
  }) => {
    return api.post<GradeResponse>('/grades', data)
  },

  updateGrade: async (
    id: string,
    data: {
      value?: number
      description?: string | null
    }
  ) => {
    return api.put<GradeResponse>(`/grades/${id}`, data)
  },

  deleteGrade: async (id: string) => {
    return api.delete<void>(`/grades/${id}`)
  },
}
