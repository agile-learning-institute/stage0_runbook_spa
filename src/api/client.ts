import type { 
  RunbookList,
  RunbookContent,
  ExecuteResponse,
  ValidateResponse,
  RequiredEnvResponse,
  DevLoginRequest,
  DevLoginResponse,
  ConfigResponse,
  Error
} from './types'
import { useAuthStore } from '@/stores/auth'

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
  options: RequestInit = {},
  requireAuth: boolean = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  // Add Authorization header if authentication is required
  if (requireAuth) {
    const authStore = useAuthStore()
    if (authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  // Handle 401 Unauthorized - token may be expired or invalid
  if (response.status === 401 && requireAuth) {
    const authStore = useAuthStore()
    authStore.logout()
    // Don't redirect here - let the router guard handle it
  }

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

async function requestWithoutAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const response = await fetch(endpoint, {
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

  return response.json()
}

async function parseSSEResponse(
  response: Response,
  onChunk?: (event: 'stdout' | 'stderr', data: string) => void
): Promise<ExecuteResponse> {
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  if (!reader) throw new ApiError('No response body', 500)
  let buffer = ''
  let result: ExecuteResponse | null = null
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split(/\n\n+/)
    buffer = events.pop() || ''
    for (const eventStr of events) {
      const lines = eventStr.split('\n')
      let eventType = ''
      const dataLines: string[] = []
      for (const line of lines) {
        if (line.startsWith('event: ')) eventType = line.slice(7).trim()
        else if (line.startsWith('data: ')) dataLines.push(line.slice(6))
      }
      const data = dataLines.join('\n')
      if (eventType === 'stdout' && onChunk) onChunk('stdout', data)
      else if (eventType === 'stderr' && onChunk) onChunk('stderr', data)
      else if (eventType === 'done') result = JSON.parse(data) as ExecuteResponse
    }
  }
  if (!result) throw new ApiError('No done event in stream', 500)
  return result
}

export const api = {
  // Authentication endpoints
  // Note: /dev-login is proxied through nginx when ENABLE_DEV_LOGIN_PROXY=true
  // In production, this proxy is disabled (returns 404) for security
  async devLogin(requestData: DevLoginRequest = {}): Promise<DevLoginResponse> {
    return requestWithoutAuth<DevLoginResponse>('/dev-login', {
      method: 'POST',
      body: JSON.stringify(requestData),
    })
  },

  // Runbook endpoints
  async listRunbooks(): Promise<RunbookList> {
    return request<RunbookList>('/runbooks')
  },

  async getRunbook(filename: string): Promise<RunbookContent> {
    return request<RunbookContent>(`/runbooks/${encodeURIComponent(filename)}`)
  },

  async executeRunbook(
    filename: string,
    envVars: Record<string, string> = {},
    onChunk?: (event: 'stdout' | 'stderr', data: string) => void
  ): Promise<ExecuteResponse> {
    const authStore = useAuthStore()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
    }
    const response = await fetch(`${API_BASE}/runbooks/${encodeURIComponent(filename)}/execute`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ env_vars: envVars }),
    })
    if (!response.ok) {
      let errorData: Error | null = null
      try {
        errorData = await response.json()
      } catch {
        /* ignore */
      }
      throw new ApiError(
        errorData?.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData || undefined
      )
    }
    if (response.status === 401 && authStore.token) {
      authStore.logout()
    }
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('text/event-stream')) {
      return parseSSEResponse(response, onChunk)
    }
    return response.json()
  },

  async validateRunbook(
    filename: string,
    envVars: Record<string, string> = {}
  ): Promise<ValidateResponse> {
    return request<ValidateResponse>(`/runbooks/${encodeURIComponent(filename)}/validate`, {
      method: 'PATCH',
      body: JSON.stringify({ env_vars: envVars }),
    })
  },

  async getRequiredEnv(filename: string): Promise<RequiredEnvResponse> {
    return request<RequiredEnvResponse>(`/runbooks/${encodeURIComponent(filename)}/required-env`)
  },

  // Config endpoint
  async getConfig(): Promise<ConfigResponse> {
    return request<ConfigResponse>('/config')
  },
}

export { ApiError }

