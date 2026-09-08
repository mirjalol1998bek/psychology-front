<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const error = ref('')

function readFragment(): { access?: string; refresh?: string } {
  // Backend redirects to /auth/hemis#access=<jwt>&refresh=<jwt>
  const hash = window.location.hash.replace(/^#/, '')
  const params = new URLSearchParams(hash)
  return { access: params.get('access') ?? undefined, refresh: params.get('refresh') ?? undefined }
}

onMounted(async () => {
  const { access, refresh } = readFragment()
  // Strip the tokens from the address bar immediately.
  history.replaceState(null, '', window.location.pathname)

  if (!access || !refresh) {
    error.value = 'HEMIS javobida token topilmadi.'
    return
  }

  const ok = await auth.completeHemisLogin(access, refresh)
  if (ok) {
    router.replace('/')
  } else {
    error.value = 'Kirish amalga oshmadi. Qaytadan urinib ko‘ring.'
  }
})
</script>

<template>
  <div class="hemis-callback">
    <template v-if="!error">
      <v-progress-circular indeterminate color="primary" size="40" />
      <p class="text-body-2 text-medium-emphasis mt-4">HEMIS orqali kirilmoqda…</p>
    </template>
    <template v-else>
      <v-icon icon="mdi-alert-circle-outline" color="error" size="40" />
      <p class="text-body-2 mt-4 mb-4">{{ error }}</p>
      <v-btn color="primary" variant="tonal" to="/login">Kirish sahifasiga</v-btn>
    </template>
  </div>
</template>

<style scoped>
.hemis-callback {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  background: rgb(var(--v-theme-background));
}
</style>
