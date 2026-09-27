import { api } from './api'
import type { EnrollmentResponse } from '../types/api'

export const enrollmentsService = {
  createEnrollment: async (data: { student_id: string; class_id: string }) => {
    return api.post<EnrollmentResponse>('/enrollments', data)
  },

  deleteEnrollment: async (id: string) => {
    return api.delete<void>(`/enrollments/${id}`)
  },
}
