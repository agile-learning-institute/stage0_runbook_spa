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

