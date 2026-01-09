// Type definitions based on OpenAPI spec

export interface Error {
  error: string
  success: false
  runbook?: string
}

export interface RunbookInfo {
  filename: string
  name: string
  path: string
}

export interface RunbookList {
  success: boolean
  runbooks: RunbookInfo[]
}

export interface RunbookContent {
  success: boolean
  filename: string
  name: string
  content: string
}

export interface ExecuteResponse {
  success: boolean
  runbook: string
  return_code: number
  stdout?: string
  stderr?: string
  errors: string[]
  warnings: string[]
  viewer_link: string
}

export interface ValidateResponse {
  success: boolean
  runbook: string
  errors: string[]
  warnings: string[]
}

export interface EnvVarInfo {
  name: string
  description: string
}

export interface RequiredEnvResponse {
  success: boolean
  filename: string
  required: EnvVarInfo[]
  available: EnvVarInfo[]
  missing: EnvVarInfo[]
}

export interface DevLoginRequest {
  subject?: string
  roles?: string[]
}

export interface DevLoginResponse {
  access_token: string
  token_type: string
  expires_at: string
  subject: string
  roles: string[]
}
