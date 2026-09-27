import { api } from './client'
import type { UserResponse, UserRole } from './types'

interface UserUpdateInput {
  name?: string
  email?: string
}

export const usersApi = {
  me: () => api.get<UserResponse>('/users/me'),
  updateMe: (data: UserUpdateInput) => api.put<UserResponse>('/users/me', data),
  list: () => api.get<UserResponse[]>('/users'),
  updateRole: (id: string, role: UserRole) => api.put<UserResponse>(`/users/${id}/role`, { role }),
  delete: (id: string) => api.delete(`/users/${id}`),
}