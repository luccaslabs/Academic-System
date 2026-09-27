import { api } from './api'
import type { UserResponse, UserRole } from '../types/api'

export const usersService = {
  getUsers: async () => {
    return api.get<UserResponse[]>('/users')
  },

  updateUserRole: async (id: string, role: UserRole) => {
    return api.put<UserResponse>(`/users/${id}/role`, { role })
  },

  deleteUser: async (id: string) => {
    return api.delete<void>(`/users/${id}`)
  },
}
