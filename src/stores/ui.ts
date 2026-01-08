import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const loading = ref(false)
  const errorMessage = ref<string | null>(null)

  function setLoading(value: boolean) {
    loading.value = value
  }

  function setError(message: string | null) {
    errorMessage.value = message
  }

  function clearError() {
    errorMessage.value = null
  }

  return {
    loading,
    errorMessage,
    setLoading,
    setError,
    clearError,
  }
})

