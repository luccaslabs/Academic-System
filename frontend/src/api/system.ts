import { api } from './client'
import type { DashboardResponse, SearchResponse } from './types'

export const systemApi = {
  search: (query: string) => api.get<SearchResponse>('/search', { q: query }),
  dashboard: () => api.get<DashboardResponse>('/dashboard'),
}