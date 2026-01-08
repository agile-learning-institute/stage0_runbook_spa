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
            <p class="text-body-1 mb-2">
              Enter values for required environment variables:
            </p>
            <v-alert
              v-if="requiredEnvVars.length === 0"
              type="info"
              variant="tonal"
              class="mb-4"
            >
              This runbook does not require any environment variables.
            </v-alert>
            <v-text-field
              v-for="envVar in requiredEnvVars"
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
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { marked } from 'marked'
import { api, ApiError } from '@/api/client'
import type { RunbookContent, ExecuteResponse } from '@/api/types'

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()

const filename = computed(() => decodeURIComponent(route.params.filename as string))

interface EnvVarInfo {
  name: string
  description: string
}

const requiredEnvVars = ref<EnvVarInfo[]>([])
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
})

// Extract environment requirements from runbook content
const extractEnvRequirements = (content: string): EnvVarInfo[] => {
  const envVars: EnvVarInfo[] = []
  
  // Find Environment Requirements section
  const envSectionMatch = content.match(/^#\s+Environment Requirements\s*$/m)
  if (!envSectionMatch) {
    return envVars
  }
  
  const startPos = envSectionMatch.index! + envSectionMatch[0].length
  const nextSectionMatch = content.substring(startPos).match(/^#\s+/m)
  const endPos = nextSectionMatch 
    ? startPos + nextSectionMatch.index! 
    : content.length
  
  const envSection = content.substring(startPos, endPos)
  
  // Find YAML code block
  const yamlMatch = envSection.match(/```yaml\s*\n(.*?)```/s)
  if (!yamlMatch) {
    return envVars
  }
  
  const yamlContent = yamlMatch[1].trim()
  
  // Parse YAML (simple parser for key: value pairs)
  for (const line of yamlContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    
    const colonIndex = trimmed.indexOf(':')
    if (colonIndex === -1) continue
    
    const name = trimmed.substring(0, colonIndex).trim()
    const description = trimmed.substring(colonIndex + 1).trim()
    
    if (name) {
      envVars.push({ name, description })
    }
  }
  
  return envVars
}

// Update required env vars when runbook content loads
watch(runbook, (newRunbook) => {
  if (newRunbook?.content) {
    requiredEnvVars.value = extractEnvRequirements(newRunbook.content)
    // Initialize env var values
    envVarValues.value = {}
    for (const envVar of requiredEnvVars.value) {
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
  if (requiredEnvVars.value.length === 0) return true
  return requiredEnvVars.value.every(
    (envVar) => envVarValues.value[envVar.name]?.trim()
  )
})

function openExecuteDialog() {
  // Reset env var values
  envVarValues.value = {}
  for (const envVar of requiredEnvVars.value) {
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

