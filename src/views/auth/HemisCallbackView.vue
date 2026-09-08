<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const error = ref('')
const state = ref<'loading' | 'pending' | 'rejected'>('loading')

function readFragment() {
  // Backend redirects to /auth/hemis#access=<jwt>&refresh=<jwt>
  // (or #error=<msg> / #pending=1 / #rejected=1)
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return {
    access: params.get('access') ?? undefined,
    refresh: params.get('refresh') ?? undefined,
    err: params.get('error') ?? undefined,
    pending: params.get('pending') === '1',
    rejected: params.get('rejected') === '1',
  }
}

onMounted(async () => {
  const { access, refresh, err, pending, rejected } = readFragment()
  // Strip the fragment from the address bar immediately.
  history.replaceState(null, '', window.location.pathname)

  if (pending) {
    state.value = 'pending'
    return
  }
  if (rejected) {
    state.value = 'rejected'
    return
  }
  if (err) {
    error.value = err
    return
  }
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
    <template v-if="state === 'pending'">
      <v-icon icon="mdi-clock-outline" color="primary" size="44" />
      <h2 class="text-h6 mt-4 mb-2">Arizangiz yuborildi</h2>
      <p class="text-body-2 text-medium-emphasis mb-4" style="max-width: 40ch">
        Hisobingiz administrator tasdig‘ini kutmoqda. Tasdiqlangach, HEMIS orqali
        qayta kirib tizimga o‘tasiz.
      </p>
      <v-btn color="primary" variant="tonal" to="/login">Kirish sahifasiga</v-btn>
    </template>

    <template v-else-if="state === 'rejected'">
      <v-icon icon="mdi-cancel" color="error" size="44" />
      <h2 class="text-h6 mt-4 mb-2">Kirish rad etilgan</h2>
      <p class="text-body-2 text-medium-emphasis mb-4" style="max-width: 40ch">
        Administrator hisobingizga kirish ruxsatini bermadi. Savollar bo‘lsa
        psixologik xizmat bilan bog‘laning.
      </p>
      <v-btn color="primary" variant="tonal" to="/login">Kirish sahifasiga</v-btn>
    </template>

    <template v-else-if="!error">
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
