import { api } from './client'
import type { DisciplineResponse } from './types'

interface DisciplineInput {
  name: string
  code: string
}

export const disciplinesApi = {
  list: () => api.get<DisciplineResponse[]>('/disciplines'),
  get: (id: string) => api.get<DisciplineResponse>(`/disciplines/${id}`),
  create: (data: DisciplineInput) => api.post<DisciplineResponse>('/disciplines', data),
  update: (id: string, data: Partial<DisciplineInput>) => api.put<DisciplineResponse>(`/disciplines/${id}`, data),
  delete: (id: string) => api.delete(`/disciplines/${id}`),
}