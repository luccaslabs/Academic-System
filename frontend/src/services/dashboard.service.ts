import { api } from './api'
import type { DashboardResponse } from '../types/api'

export const dashboardService = {
  getDashboard: async () => {
    return api.get<DashboardResponse>('/dashboard')
  },
}
