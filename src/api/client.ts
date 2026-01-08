import type { 
  RunbookList,
  RunbookContent,
  ExecuteResponse,
  ValidateResponse,
  Error
} from './types'

const API_BASE = '/api'

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Error
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorData: Error | null = null
    try {
      errorData = await response.json()
    } catch {
      // Ignore JSON parse errors
    }
    throw new ApiError(
      errorData?.error || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData || undefined
    )
  }

  // Handle empty responses
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T
  }

  return response.json()
}

function buildQueryString(params: Record<string, string>): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.append(key, value)
    }
  }
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export const api = {
  // Runbook endpoints
  async listRunbooks(): Promise<RunbookList> {
    return request<RunbookList>('/runbooks')
  },

  async getRunbook(filename: string): Promise<RunbookContent> {
    return request<RunbookContent>(`/${filename}`)
  },

  async executeRunbook(
    filename: string,
    envVars: Record<string, string>
  ): Promise<ExecuteResponse> {
    const queryString = buildQueryString(envVars)
    return request<ExecuteResponse>(`/${filename}${queryString}`, {
      method: 'POST',
    })
  },

  async validateRunbook(
    filename: string,
    envVars: Record<string, string> = {}
  ): Promise<ValidateResponse> {
    const queryString = buildQueryString(envVars)
    return request<ValidateResponse>(`/${filename}${queryString}`, {
      method: 'PATCH',
    })
  },
}

export { ApiError }

