const API_URL = import.meta.env.VITE_API_BASE_URL

if (!API_URL) {
  throw new Error(
    'VITE_API_BASE_URL não está definida. Confirme que existe um arquivo .env na raiz do projeto frontend com VITE_API_BASE_URL=http://localhost:8000, e reinicie o servidor de desenvolvimento depois de criar ou editar esse arquivo.'
  )
}

type UnauthorizedHandler = () => void
let unauthorizedHandler: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[2]) : null
}

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

interface PydanticValidationError {
  type: string
  loc: (string | number)[]
  msg: string
  input?: unknown
}

function extractErrorMessage(data: unknown, status: number): string {

  if (!data || typeof data !== 'object') {
    return `Erro na requisição (${status})`
  }

  const detail = (data as { detail?: unknown }).detail

  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail)) {
    return (detail as PydanticValidationError[])
      .map((item) => {
        const field = item.loc[item.loc.length - 1]
        return `${field}: ${item.msg}`
      })
      .join(', ')
  }

  return `Erro na requisição (${status})`
}
export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.status = status
    this.detail = detail
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  params?: Record<string, string | number | undefined>
}

async function request<T>(path: string, { method = 'GET', body, params }: RequestOptions = {}): Promise<T> {
  const url = new URL(API_URL + path)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    })
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (UNSAFE_METHODS.has(method)) {
    const csrfToken = getCookie('csrf_token')
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })

  if (response.status === 204) {
    return null as T
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json() : null

  if (!response.ok) {
    if (response.status === 401 && unauthorizedHandler) {
      unauthorizedHandler()
    }
    throw new ApiError(response.status, extractErrorMessage(data, response.status))
  }

  return data as T
}

export const api = {
  get: <T>(path: string, params?: RequestOptions['params']) => request<T>(path, { method: 'GET', params }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T = null>(path: string) => request<T>(path, { method: 'DELETE' }),
}