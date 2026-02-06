<template>
  <v-app>
    <v-app-bar color="primary" prominent>
      <v-app-bar-title>{{ uiHeader }}</v-app-bar-title>
      <v-spacer />
      <template v-if="authStore.isAuthenticated">
        <span class="text-body-2 mr-4">User: {{ authStore.subject || 'Unknown' }}</span>
        <v-btn
          icon="mdi-home"
          variant="text"
          @click="router.push('/runbooks')"
          title="Home"
        />
        <v-btn
          icon="mdi-cog"
          variant="text"
          @click="router.push('/admin')"
          title="Admin"
        />
        <v-btn
          icon="mdi-logout"
          variant="text"
          @click="handleLogout"
          title="Logout"
        />
      </template>
      <template v-else>
        <v-btn
          color="white"
          variant="text"
          @click="router.push('/login')"
        >
          Login
        </v-btn>
      </template>
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/api/client'
import type { ConfigResponse } from '@/api/types'

const DEFAULT_UI_HEADER = 'Stage0 Runbook Automation'

const router = useRouter()
const authStore = useAuthStore()

const { data: configData } = useQuery<ConfigResponse>({
  queryKey: ['config'],
  queryFn: () => api.getConfig(),
  enabled: () => authStore.isAuthenticated,
})

const uiHeader = computed(() => {
  const item = configData.value?.config_items?.find((c) => c.name === 'UI_HEADER')
  return (item?.value?.trim() && item.value) || DEFAULT_UI_HEADER
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

