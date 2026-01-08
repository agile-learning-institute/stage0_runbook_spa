<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <span class="text-h5">{{ runbook?.name || 'Loading...' }}</span>
            <v-spacer />
            <v-btn
              color="primary"
              prepend-icon="mdi-play"
              :loading="executeMutation.isPending.value"
              @click="openExecuteDialog"
            >
              Execute
            </v-btn>
          </v-card-title>
          <v-card-text>
            <div v-if="isLoading" class="text-center pa-8">
              <v-progress-circular indeterminate color="primary" />
            </div>
            <div v-else-if="error" class="text-error pa-4">
              {{ error }}
            </div>
            <div v-else-if="runbook" class="runbook-content">
              <v-card variant="outlined" class="pa-4">
                <div v-html="renderedContent" class="markdown-body" />
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Execute Dialog -->
    <v-dialog v-model="showExecuteDialog" max-width="600">
      <v-card>
        <v-card-title>Execute Runbook</v-card-title>
        <v-card-text>
          <div class="mb-4">
            <div v-if="isLoadingEnv" class="text-center pa-4">
              <v-progress-circular indeterminate color="primary" />
            </div>
            <div v-else>
              <p class="text-body-1 mb-2">
                <span v-if="missingEnvVars.length > 0">
                  Enter values for missing environment variables:
                </span>
                <span v-else>
                  All required environment variables are already available.
                </span>
              </p>
              
              <v-alert
                v-if="availableEnvVars.length > 0"
                type="success"
                variant="tonal"
                class="mb-4"
              >
                <div class="text-subtitle-2 mb-2">Available environment variables:</div>
                <ul class="mb-0">
                  <li v-for="envVar in availableEnvVars" :key="envVar.name">
                    <strong>{{ envVar.name }}</strong>: {{ envVar.description }}
                  </li>
                </ul>
              </v-alert>
              
              <v-alert
                v-if="missingEnvVars.length === 0"
                type="info"
                variant="tonal"
                class="mb-4"
              >
                This runbook does not require any additional environment variables.
              </v-alert>
              
              <v-text-field
                v-for="envVar in missingEnvVars"
                :key="envVar.name"
                v-model="envVarValues[envVar.name]"
                :label="envVar.name"
                :hint="envVar.description"
                persistent-hint
                variant="outlined"
                class="mb-2"
                :required="true"
              />
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeExecuteDialog"
            :disabled="executeMutation.isPending.value"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="handleExecute"
            :loading="executeMutation.isPending.value"
            :disabled="!canExecute || executeMutation.isPending.value"
          >
            Execute
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Execution Result Dialog -->
    <v-dialog v-model="showResultDialog" max-width="800">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon
            :color="executionResult?.success ? 'success' : 'error'"
            class="mr-2"
          >
            {{ executionResult?.success ? 'mdi-check-circle' : 'mdi-alert-circle' }}
          </v-icon>
          Execution {{ executionResult?.success ? 'Successful' : 'Failed' }}
        </v-card-title>
        <v-card-text>
          <div class="mb-4">
            <p><strong>Return Code:</strong> {{ executionResult?.return_code }}</p>
          </div>
          <v-expansion-panels v-if="executionResult">
            <v-expansion-panel v-if="executionResult.stdout">
              <v-expansion-panel-title>Standard Output</v-expansion-panel-title>
              <v-expansion-panel-text>
                <pre class="text-body-2">{{ executionResult.stdout }}</pre>
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel v-if="executionResult.stderr">
              <v-expansion-panel-title>Standard Error</v-expansion-panel-title>
              <v-expansion-panel-text>
                <pre class="text-body-2">{{ executionResult.stderr }}</pre>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            @click="handleCloseResult"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { marked } from 'marked'
import { api, ApiError } from '@/api/client'
import type { RunbookContent, ExecuteResponse, EnvVarInfo, RequiredEnvResponse } from '@/api/types'

const route = useRoute()
const queryClient = useQueryClient()

const filename = computed(() => decodeURIComponent(route.params.filename as string))

const requiredEnvVars = ref<EnvVarInfo[]>([])
const availableEnvVars = ref<EnvVarInfo[]>([])
const missingEnvVars = ref<EnvVarInfo[]>([])
const envVarValues = ref<Record<string, string>>({})
const showExecuteDialog = ref(false)
const showResultDialog = ref(false)
const executionResult = ref<ExecuteResponse | null>(null)

// Fetch runbook content
const { data: runbook, isLoading, error, refetch } = useQuery<RunbookContent>({
  queryKey: ['runbook', filename.value],
  queryFn: () => api.getRunbook(filename.value),
})

// Watch for filename changes
watch(filename, (newFilename) => {
  queryClient.invalidateQueries({ queryKey: ['runbook', newFilename] })
  queryClient.invalidateQueries({ queryKey: ['required-env', newFilename] })
})

// Fetch required environment variables
const { data: requiredEnvData, isLoading: isLoadingEnv, refetch: refetchEnv } = useQuery<RequiredEnvResponse>({
  queryKey: ['required-env', filename.value],
  queryFn: () => api.getRequiredEnv(filename.value),
})

// Update env vars when data loads
watch(requiredEnvData, (data) => {
  if (data) {
    requiredEnvVars.value = data.required || []
    availableEnvVars.value = data.available || []
    missingEnvVars.value = data.missing || []
    // Initialize env var values for missing vars only
    envVarValues.value = {}
    for (const envVar of missingEnvVars.value) {
      envVarValues.value[envVar.name] = ''
    }
  }
}, { immediate: true })

// Render markdown content
const renderedContent = computed(() => {
  if (!runbook.value?.content) return ''
  return marked.parse(runbook.value.content)
})

const canExecute = computed(() => {
  if (missingEnvVars.value.length === 0) return true
  return missingEnvVars.value.every(
    (envVar) => envVarValues.value[envVar.name]?.trim()
  )
})

async function openExecuteDialog() {
  // Refetch required env vars to get latest status
  await refetchEnv()
  // Reset env var values for missing vars
  envVarValues.value = {}
  for (const envVar of missingEnvVars.value) {
    envVarValues.value[envVar.name] = ''
  }
  showExecuteDialog.value = true
}

function closeExecuteDialog() {
  showExecuteDialog.value = false
}

// Execute mutation
const executeMutation = useMutation({
  mutationFn: (envVars: Record<string, string>) => 
    api.executeRunbook(filename.value, envVars),
  onSuccess: (result) => {
    executionResult.value = result
    showExecuteDialog.value = false
    showResultDialog.value = true
    // Refetch runbook to get updated content with history
    refetch()
  },
  onError: (error: ApiError) => {
      executionResult.value = {
        success: false,
        runbook: filename.value,
        return_code: error.status === 500 ? 1 : 1,
        stdout: '',
        stderr: error.message,
        errors: [error.message],
        warnings: [],
        viewer_link: '',
      }
      showExecuteDialog.value = false
      showResultDialog.value = true
    },
})

function handleExecute() {
  if (!canExecute.value) return
  
  // Filter out empty values
  const envVars: Record<string, string> = {}
  for (const [key, value] of Object.entries(envVarValues.value)) {
    if (value?.trim()) {
      envVars[key] = value.trim()
    }
  }
  
  executeMutation.mutate(envVars)
}

function handleCloseResult() {
  showResultDialog.value = false
  executionResult.value = null
}
</script>

<style scoped>
.runbook-content {
  max-width: 100%;
  overflow-x: auto;
}

.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
  line-height: 1.6;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.markdown-body :deep(pre) {
  background: #f5f5f5;
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
}

.markdown-body :deep(code) {
  background: #f5f5f5;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin-left: 1.5em;
}

.markdown-body :deep(p) {
  margin-bottom: 1em;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid #ddd;
  padding: 0.5em;
  text-align: left;
}

.markdown-body :deep(th) {
  background: #f5f5f5;
  font-weight: 600;
}
</style>

