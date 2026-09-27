import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { UserResponse } from '../types/api'
import { authService } from '../services/auth.service'
import { setUnauthorizedHandler } from '../services/api'

interface AuthContextData {
  user: UserResponse | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: { email: string; password: string }) => Promise<UserResponse>
  register: (userData: { name: string; email: string; password: string }) => Promise<UserResponse>
  logout: () => Promise<void>
  refreshUser: () => Promise<UserResponse | null>
  updateProfile: (data: { name?: string; email?: string }) => Promise<UserResponse>
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const refreshUser = useCallback(async (): Promise<UserResponse | null> => {
    try {
      const userData = await authService.getMe()
      setUser(userData)
      return userData
    } catch {
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    // Setup 401 callback from api interceptor
    setUnauthorizedHandler(() => {
      setUser(null)
    })

    // Initial check on load / refresh
    const initAuth = async () => {
      setIsLoading(true)
      try {
        await refreshUser()
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [refreshUser])

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true)
    try {
      await authService.login(credentials)
      const userData = await authService.getMe()
      setUser(userData)
      return userData
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: { name: string; email: string; password: string }) => {
    setIsLoading(true)
    try {
      const newUser = await authService.register(userData)
      // Automatically attempt login after successful registration
      try {
        await authService.login({ email: userData.email, password: userData.password })
        const me = await authService.getMe()
        setUser(me)
        return me
      } catch {
        return newUser
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await authService.logout()
    } catch {
      // Ignore logout errors and clear state
    } finally {
      setUser(null)
      setIsLoading(false)
    }
  }

  const updateProfile = async (data: { name?: string; email?: string }) => {
    const updated = await authService.updateMe(data)
    setUser(updated)
    return updated
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
