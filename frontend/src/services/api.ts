import { getCookie } from '../utils/cookie'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: any
  params?: Record<string, string | number | boolean | undefined | null>
}

let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, params, headers = {}, ...customConfig } = options

  // Build full URL with query parameters
  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString
    }
  }

  const reqHeaders: Record<string, string> = {
    'Accept': 'application/json',
    ...(headers as Record<string, string>),
  }

  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())

  if (isMutation) {
    const csrfToken = getCookie('csrf_token')
    if (csrfToken) {
      reqHeaders['X-CSRF-Token'] = csrfToken
    }
  }

  let requestBody: any = undefined
  if (body !== undefined) {
    if (body instanceof FormData) {
      requestBody = body
    } else {
      reqHeaders['Content-Type'] = 'application/json'
      requestBody = JSON.stringify(body)
    }
  }

  const config: RequestInit = {
    method,
    headers: reqHeaders,
    body: requestBody,
    credentials: 'include', // Include httpOnly and session cookies
    ...customConfig,
  }

  try {
    const response = await fetch(url, config)

    if (response.status === 204) {
      return null as unknown as T
    }

    if (response.status === 401) {
      if (unauthorizedHandler) {
        unauthorizedHandler()
      }
      throw new ApiError(401, 'Sessão expirada ou não autenticada. Faça login novamente.')
    }

    if (response.status === 403) {
      let detail = 'Você não possui permissão para acessar ou realizar esta ação neste recurso.'
      try {
        const errorData = await response.json()
        if (errorData?.detail) detail = errorData.detail
      } catch {
        // use default detail
      }
      throw new ApiError(403, detail)
    }

    if (response.status === 429) {
      let detail = 'Muitas requisições em pouco tempo. Por favor, aguarde alguns instantes antes de tentar novamente.'
      try {
        const errorData = await response.json()
        if (errorData?.detail) detail = errorData.detail
      } catch {
        // use default
      }
      throw new ApiError(429, detail)
    }

    if (!response.ok) {
      let detail = `Erro na requisição (${response.status})`
      try {
        const errorData = await response.json()
        if (typeof errorData?.detail === 'string') {
          detail = errorData.detail
        } else if (Array.isArray(errorData?.detail)) {
          // FastAPI validation error array
          detail = errorData.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ')
        } else if (errorData?.message) {
          detail = errorData.message
        }
      } catch {
        detail = response.statusText || detail
      }
      throw new ApiError(response.status, detail)
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    }

    return (await response.text()) as unknown as T
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error
    }
    // Network or other fetch errors
    throw new ApiError(0, error.message || 'Falha de conexão com o servidor. Verifique se o backend está ativo.')
  }
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),
  put: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'PUT', body }),
  patch: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', body }),
  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
}

