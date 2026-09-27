import { api } from './api'
import type { DisciplineResponse } from '../types/api'

export const disciplinesService = {
  getDisciplines: async () => {
    return api.get<DisciplineResponse[]>('/disciplines')
  },

  getDiscipline: async (id: string) => {
    return api.get<DisciplineResponse>(`/disciplines/${id}`)
  },

  createDiscipline: async (data: { name: string; code: string }) => {
    return api.post<DisciplineResponse>('/disciplines', data)
  },

  updateDiscipline: async (id: string, data: { name?: string; code?: string }) => {
    return api.put<DisciplineResponse>(`/disciplines/${id}`, data)
  },

  deleteDiscipline: async (id: string) => {
    return api.delete<void>(`/disciplines/${id}`)
  },
}
