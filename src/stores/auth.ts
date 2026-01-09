import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const TOKEN_KEY = 'stage0_runbook_token'
const SUBJECT_KEY = 'stage0_runbook_subject'
const ROLES_KEY = 'stage0_runbook_roles'
const EXPIRES_AT_KEY = 'stage0_runbook_expires_at'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const subject = ref<string | null>(localStorage.getItem(SUBJECT_KEY))
  const roles = ref<string[]>(() => {
    const stored = localStorage.getItem(ROLES_KEY)
    return stored ? JSON.parse(stored) : []
  })
  const expiresAt = ref<string | null>(localStorage.getItem(EXPIRES_AT_KEY))

  const isAuthenticated = computed(() => {
    if (!token.value) return false
    
    // Check if token is expired
    if (expiresAt.value) {
      const expiryTime = new Date(expiresAt.value).getTime()
      const now = Date.now()
      if (expiryTime <= now) {
        // Token expired, clear it
        logout()
        return false
      }
    }
    
    return true
  })

  function setAuth(loginResponse: { access_token: string; token_type: string; expires_at: string; subject: string; roles: string[] }) {
    token.value = loginResponse.access_token
    subject.value = loginResponse.subject
    roles.value = loginResponse.roles
    expiresAt.value = loginResponse.expires_at

    localStorage.setItem(TOKEN_KEY, loginResponse.access_token)
    localStorage.setItem(SUBJECT_KEY, loginResponse.subject)
    localStorage.setItem(ROLES_KEY, JSON.stringify(loginResponse.roles))
    localStorage.setItem(EXPIRES_AT_KEY, loginResponse.expires_at)
  }

  function logout() {
    token.value = null
    subject.value = null
    roles.value = []
    expiresAt.value = null

    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(SUBJECT_KEY)
    localStorage.removeItem(ROLES_KEY)
    localStorage.removeItem(EXPIRES_AT_KEY)
  }

  function hasRole(role: string): boolean {
    return roles.value.includes(role)
  }

  return {
    token,
    subject,
    roles,
    expiresAt,
    isAuthenticated,
    setAuth,
    logout,
    hasRole,
  }
})
