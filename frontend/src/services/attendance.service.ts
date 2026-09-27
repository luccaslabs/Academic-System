import { api } from './api'
import type { AttendanceResponse } from '../types/api'

export const attendanceService = {
  getAttendanceByEnrollment: async (enrollmentId: string) => {
    return api.get<AttendanceResponse[]>(`/attendance/enrollment/${enrollmentId}`)
  },

  createAttendance: async (data: {
    enrollment_id: string
    class_date: string
    present: boolean
  }) => {
    return api.post<AttendanceResponse>('/attendance', data)
  },

  updateAttendance: async (id: string, data: { present: boolean }) => {
    return api.put<AttendanceResponse>(`/attendance/${id}`, data)
  },
}
