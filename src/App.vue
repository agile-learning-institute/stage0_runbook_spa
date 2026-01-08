<template>
  <v-app>
    <v-app-bar color="primary" prominent>
      <v-app-bar-title>Stage0 Runbook Automation</v-app-bar-title>
      <v-spacer />
      <v-btn
        icon="mdi-home"
        variant="text"
        @click="router.push('/runbooks')"
      />
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

const router = useRouter()
</script>

