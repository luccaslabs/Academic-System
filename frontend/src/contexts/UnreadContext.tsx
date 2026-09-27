import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { notificationsService } from '../services/notifications.service'
import type { UnreadSummaryResponse } from '../types/api'
import { useAuth } from './AuthContext'

interface UnreadContextData {
  summary: UnreadSummaryResponse
  refresh: () => Promise<void>
}

const UnreadContext = createContext<UnreadContextData>({
  summary: { notice: 0, calendar_event: 0 },
  refresh: async () => {},
})

export const UnreadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [summary, setSummary] = useState<UnreadSummaryResponse>({
    notice: 0,
    calendar_event: 0,
  })

  const refresh = useCallback(async () => {
    if (!user) {
      setSummary({ notice: 0, calendar_event: 0 })
      return
    }
    try {
      const data = await notificationsService.getUnreadSummary()
      setSummary(data || { notice: 0, calendar_event: 0 })
    } catch {
      // Fail silently on summary fetch
    }
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <UnreadContext.Provider value={{ summary, refresh }}>
      {children}
    </UnreadContext.Provider>
  )
}

export const useUnreadContext = () => useContext(UnreadContext)
