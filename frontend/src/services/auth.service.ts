import { api } from './api'
import type { UserResponse } from '../types/api'

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    return api.post<{ access_token: string; token_type: string }>('/auth/login', credentials)
  },

  register: async (userData: { name: string; email: string; password: string }) => {
    return api.post<UserResponse>('/auth/register', userData)
  },

  logout: async () => {
    return api.post<void>('/auth/logout')
  },

  getMe: async () => {
    return api.get<UserResponse>('/users/me')
  },

  updateMe: async (userData: { name?: string; email?: string }) => {
    return api.put<UserResponse>('/users/me', userData)
  },
}
