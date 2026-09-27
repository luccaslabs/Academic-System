import { api } from './client'
import type { UserResponse } from './types'

interface TokenResponse {
  access_token: string
  token_type: string
}

interface RegisterInput {
  name: string
  email: string
  password: string
}

interface LoginInput {
  email: string
  password: string
}

export function register(data: RegisterInput) {
  return api.post<UserResponse>('/auth/register', data)
}

export function login(data: LoginInput) {
  return api.post<TokenResponse>('/auth/login', data)
}

export function logout() {
  return api.post<null>('/auth/logout')
}

export function getMe() {
  return api.get<UserResponse>('/users/me')
}