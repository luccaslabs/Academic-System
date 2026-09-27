import { api } from './api'
import type { SchoolClassResponse, SchoolClassDetailResponse } from '../types/api'

export const classesService = {
  getClasses: async () => {
    return api.get<SchoolClassResponse[]>('/classes')
  },

  getClass: async (id: string) => {
    return api.get<SchoolClassDetailResponse>(`/classes/${id}`)
  },

  createClass: async (data: {
    name: string
    year: string
    discipline_id: string
    teacher_id?: string | null
  }) => {
    return api.post<SchoolClassResponse>('/classes', data)
  },

  updateClass: async (
    id: string,
    data: {
      name?: string
      year?: string
      teacher_id?: string | null
    }
  ) => {
    return api.put<SchoolClassResponse>(`/classes/${id}`, data)
  },

  updatePassingAverage: async (id: string, passing_average: number) => {
    return api.put<SchoolClassResponse>(`/classes/${id}/passing-average`, { passing_average })
  },

  deleteClass: async (id: string) => {
    return api.delete<void>(`/classes/${id}`)
  },
}
