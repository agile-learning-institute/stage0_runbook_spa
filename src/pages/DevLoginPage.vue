<template>
  <v-container class="d-flex align-center justify-center" style="min-height: 60vh">
    <v-row justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card>
          <v-card-title class="text-h5 text-center pa-6">
            Development Login
          </v-card-title>
          <v-card-subtitle class="text-center pb-4">
            Authenticate with the Stage0 Runbook API
          </v-card-subtitle>
          <v-card-text>
            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              class="mb-4"
              closable
              @click:close="error = null"
            >
              {{ error }}
            </v-alert>

            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="subject"
                label="Subject (optional)"
                hint="Default: dev-user-1"
                persistent-hint
                variant="outlined"
                class="mb-4"
              />

              <v-combobox
                v-model="roles"
                label="Roles (optional)"
                hint="Default: ['sre', 'data', 'api', 'ux'] - Enter roles separated by commas or press Enter to add each role"
                persistent-hint
                multiple
                chips
                closable-chips
                variant="outlined"
                class="mb-4"
              >
                <template #selection="{ item, index }">
                  <v-chip
                    v-if="index < 3"
                    :key="String(item)"
                    closable
                    @click:close="roles = roles.filter((r: string) => r !== String(item))"
                  >
                    {{ item }}
                  </v-chip>
                  <span
                    v-else-if="index === 3"
                    class="text-grey text-caption align-self-center"
                  >
                    (+{{ roles.length - 3 }} more)
                  </span>
                </template>
              </v-combobox>

              <v-btn
                type="submit"
                color="primary"
                block
                size="large"
                :loading="loginMutation.isPending.value"
                :disabled="loginMutation.isPending.value"
              >
                Login
              </v-btn>
            </v-form>

            <v-divider class="my-6" />

            <div class="text-body-2 text-center text-medium-emphasis">
              <p class="mb-2">
                <strong>Quick Login:</strong>
              </p>
              <v-btn
                variant="outlined"
                size="small"
                class="mr-2 mb-2"
                @click="quickLogin(['sre'])"
                :disabled="loginMutation.isPending.value"
              >
                SRE
              </v-btn>
              <v-btn
                variant="outlined"
                size="small"
                class="mr-2 mb-2"
                @click="quickLogin(['data'])"
                :disabled="loginMutation.isPending.value"
              >
                Data
              </v-btn>
              <v-btn
                variant="outlined"
                size="small"
                class="mr-2 mb-2"
                @click="quickLogin(['api'])"
                :disabled="loginMutation.isPending.value"
              >
                API
              </v-btn>
              <v-btn
                variant="outlined"
                size="small"
                class="mb-2"
                @click="quickLogin(['ux'])"
                :disabled="loginMutation.isPending.value"
              >
                UX
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMutation } from '@tanstack/vue-query'
import { api, ApiError } from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const subject = ref('')
const roles = ref<string[]>([])
const error = ref<string | null>(null)

const loginMutation = useMutation({
  mutationFn: (loginData: { subject?: string; roles?: string[] }) => 
    api.devLogin(loginData),
  onSuccess: (response) => {
    authStore.setAuth(response)
    error.value = null
    // Redirect to the original destination or runbooks list
    const redirect = route.query.redirect as string | undefined
    router.push(redirect || '/runbooks')
  },
  onError: (err: ApiError) => {
    error.value = err.message || 'Login failed. Please try again.'
  },
})

function handleLogin() {
  error.value = null
  const loginData: { subject?: string; roles?: string[] } = {}
  
  if (subject.value.trim()) {
    loginData.subject = subject.value.trim()
  }
  
  if (roles.value.length > 0) {
    loginData.roles = roles.value
  }
  
  loginMutation.mutate(loginData)
}

function quickLogin(quickRoles: string[]) {
  error.value = null
  loginMutation.mutate({ roles: quickRoles })
}
</script>
