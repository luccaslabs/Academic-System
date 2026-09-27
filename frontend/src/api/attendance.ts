import { api } from './client'
import type { AttendanceResponse } from './types'

interface AttendanceInput {
  enrollment_id: string
  class_date: string
  present: boolean
}

export const attendanceApi = {
  listByEnrollment: (enrollmentId: string) => api.get<AttendanceResponse[]>(`/attendance/enrollment/${enrollmentId}`),
  register: (data: AttendanceInput) => api.post<AttendanceResponse>('/attendance', data),
  update: (id: string, present: boolean) => api.put<AttendanceResponse>(`/attendance/${id}`, { present }),
}