<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <span class="text-h5">Runbooks</span>
            <v-spacer />
          </v-card-title>
          <v-card-text>
            <v-data-table
              :items="runbooks"
              :loading="isLoading"
              :headers="headers"
              item-value="filename"
              @click:row="handleRowClick"
              class="cursor-pointer"
            >
              <template #item.name="{ item }">
                {{ item.name }}
              </template>
              <template #item.filename="{ item }">
                <code>{{ item.filename }}</code>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/api/client'
import type { RunbookInfo } from '@/api/types'

const router = useRouter()

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Filename', key: 'filename', sortable: true },
]

const { data: runbooksList, isLoading } = useQuery({
  queryKey: ['runbooks'],
  queryFn: () => api.listRunbooks(),
})

const runbooks = computed(() => runbooksList.value?.runbooks || [])

function handleRowClick(_event: Event, { item }: { item: RunbookInfo }) {
  router.push(`/runbook/${encodeURIComponent(item.filename)}`)
}
</script>

<style scoped>
.cursor-pointer :deep(tbody tr) {
  cursor: pointer;
}
</style>

