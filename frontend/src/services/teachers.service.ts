import { api } from './api'
import type { TeacherResponse } from '../types/api'

export const teachersService = {
  getTeachers: async () => {
    return api.get<TeacherResponse[]>('/teachers')
  },

  getTeacher: async (id: string) => {
    return api.get<TeacherResponse>(`/teachers/${id}`)
  },

  createTeacher: async (data: { user_id: string; registration: string }) => {
    return api.post<TeacherResponse>('/teachers', data)
  },

  updateTeacher: async (id: string, data: { registration?: string }) => {
    return api.put<TeacherResponse>(`/teachers/${id}`, data)
  },

  deleteTeacher: async (id: string) => {
    return api.delete<void>(`/teachers/${id}`)
  },
}
