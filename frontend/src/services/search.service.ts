import { api, ApiError } from './api'
import type { SearchResponse } from '../types/api'

export const searchService = {
  search: async (query: string): Promise<SearchResponse> => {
    if (!query || query.trim().length < 2) {
      throw new ApiError(400, 'O termo de busca deve ter pelo menos 2 caracteres.')
    }
    return api.get<SearchResponse>('/search', {
      params: { q: query.trim() },
    })
  },
}
