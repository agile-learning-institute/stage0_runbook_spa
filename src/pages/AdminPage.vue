<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h5">Admin Configuration</v-card-title>
          <v-card-text>
            <div v-if="isLoading" class="text-center pa-8">
              <v-progress-circular indeterminate color="primary" />
            </div>
            <div v-else-if="error" class="text-error pa-4">
              {{ error }}
            </div>
            <div v-else-if="configData">
              <!-- Token Information Section -->
              <v-card variant="outlined" class="mb-6">
                <v-card-title class="text-h6">Token Information</v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <div class="mb-2">
                        <strong>User ID:</strong> {{ configData.token.user_id }}
                      </div>
                      <div class="mb-2">
                        <strong>Roles:</strong>
                        <v-chip
                          v-for="role in configData.token.roles"
                          :key="role"
                          size="small"
                          class="ml-2"
                        >
                          {{ role }}
                        </v-chip>
                      </div>
                      <div class="mb-2">
                        <strong>Remote IP:</strong> {{ configData.token.remote_ip }}
                      </div>
                    </v-col>
                    <v-col cols="12" md="6">
                      <div class="mb-2">
                        <strong>Claims:</strong>
                        <pre class="mt-2 pa-2 bg-grey-lighten-4 rounded">{{ JSON.stringify(configData.token.claims, null, 2) }}</pre>
                      </div>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <!-- Configuration Items Section -->
              <v-card variant="outlined">
                <v-card-title class="text-h6">Configuration Items</v-card-title>
                <v-card-text>
                  <v-data-table
                    :items="configData.config_items"
                    :headers="configHeaders"
                    item-value="name"
                    :items-per-page="-1"
                    hide-default-footer
                  >
                    <template #item.from="{ item }">
                      <v-chip
                        :color="item.from === 'environment' ? 'success' : 'default'"
                        size="small"
                      >
                        {{ item.from }}
                      </v-chip>
                    </template>
                  </v-data-table>
                </v-card-text>
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/api/client'
import type { ConfigResponse } from '@/api/types'

const configHeaders = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Value', key: 'value', sortable: true },
  { title: 'Source', key: 'from', sortable: true },
]

const { data: configData, isLoading, error } = useQuery<ConfigResponse>({
  queryKey: ['config'],
  queryFn: () => api.getConfig(),
})
</script>

<style scoped>
pre {
  font-size: 0.875rem;
  overflow-x: auto;
}
</style>
