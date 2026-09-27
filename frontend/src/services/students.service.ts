import { api } from './api'
import type { StudentResponse } from '../types/api'

export const studentsService = {
  getStudents: async () => {
    return api.get<StudentResponse[]>('/students')
  },

  getStudent: async (id: string) => {
    return api.get<StudentResponse>(`/students/${id}`)
  },

  createStudent: async (data: { user_id: string; registration: string }) => {
    return api.post<StudentResponse>('/students', data)
  },

  updateStudent: async (id: string, data: { registration?: string }) => {
    return api.put<StudentResponse>(`/students/${id}`, data)
  },

  deleteStudent: async (id: string) => {
    return api.delete<void>(`/students/${id}`)
  },
}
