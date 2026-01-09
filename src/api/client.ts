import type { 
  RunbookList,
  RunbookContent,
  ExecuteResponse,
  ValidateResponse,
  RequiredEnvResponse,
  DevLoginRequest,
  DevLoginResponse,
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
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
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

export const api = {
  // Authentication endpoints
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
    envVars: Record<string, string> = {}
  ): Promise<ExecuteResponse> {
    return request<ExecuteResponse>(`/runbooks/${encodeURIComponent(filename)}/execute`, {
      method: 'POST',
      body: JSON.stringify({ env_vars: envVars }),
    })
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
}

export { ApiError }

