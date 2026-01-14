<template>
  <v-app>
    <v-app-bar color="primary" prominent>
      <v-app-bar-title>Stage0 Runbook Automation</v-app-bar-title>
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

