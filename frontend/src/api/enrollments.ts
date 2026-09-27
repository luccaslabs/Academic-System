import { api } from './client'
import type { EnrollmentResponse } from './types'

export const enrollmentsApi = {
  create: (studentId: string, classId: string) =>
    api.post<EnrollmentResponse>('/enrollments', { student_id: studentId, class_id: classId }),
  delete: (id: string) => api.delete(`/enrollments/${id}`),
}