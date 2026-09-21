<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/services/apiClient'
import { members } from '@/services/quizService'

/**
 * Admin: HEMIS orqali kirgan, tasdiq kutayotgan xodimlar.
 *   GET  /api/users?status=pending
 *   POST /api/users/{id}/approve  { role }
 *   POST /api/users/{id}/reject
 */

interface PendingUser {
  id: number
  email: string
  hemisId: string | null
  fullName: string | null
  faculty?: { name?: string } | null
  createdAt?: string
}

const rows = ref<PendingUser[]>([])
const loading = ref(true)
const busyId = ref<number | null>(null)
const toast = ref('')
const toastOpen = ref(false)
const toastColor = ref<'success' | 'error'>('success')

const roleOptions = [
  { title: 'Psixolog', value: 'ROLE_PSYCHOLOGIST' },
  { title: 'Administrator', value: 'ROLE_ADMIN' },
  { title: 'Tyutor', value: 'ROLE_TUTOR' },
]
const chosenRole = ref<Record<number, string>>({})

function notify(msg: string, color: 'success' | 'error' = 'success') {
  toast.value = msg
  toastColor.value = color
  toastOpen.value = true
}

async function load() {
  loading.value = true
  try {
    rows.value = members<PendingUser>((await api.get('/users', { params: { status: 'pending' } })).data)
  } catch {
    notify('Ro‘yxatni yuklab bo‘lmadi', 'error')
  } finally {
    loading.value = false
  }
}

async function approve(u: PendingUser) {
  busyId.value = u.id
  try {
    await api.post(`/users/${u.id}/approve`, { role: chosenRole.value[u.id] ?? 'ROLE_PSYCHOLOGIST' })
    rows.value = rows.value.filter((r) => r.id !== u.id)
    notify(`${u.fullName ?? u.email} tasdiqlandi`)
  } catch {
    notify('Tasdiqlashda xatolik', 'error')
  } finally {
    busyId.value = null
  }
}

async function reject(u: PendingUser) {
  busyId.value = u.id
  try {
    await api.post(`/users/${u.id}/reject`, null)
    rows.value = rows.value.filter((r) => r.id !== u.id)
    notify(`${u.fullName ?? u.email} rad etildi`)
  } catch {
    notify('Rad etishda xatolik', 'error')
  } finally {
    busyId.value = null
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-head mb-4">
      <h1 class="text-h4">Kirish so‘rovlari</h1>
      <p class="text-body-2 text-medium-emphasis mb-0" style="max-width: 62ch">
        HEMIS orqali kirgan xodimlar avval shu yerda tasdiqlanadi. Tasdiqlagach, ularga
        rol beriladi va tizimga kira oladilar. Talabalar HEMIS orqali avtomatik kiradi.
      </p>
    </div>

    <v-card class="surface-card" rounded="lg">
      <div v-if="loading" class="pa-8 text-center">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <div v-else-if="!rows.length" class="pa-10 text-center text-medium-emphasis">
        <v-icon icon="mdi-check-circle-outline" size="40" class="mb-2 d-block mx-auto" color="success" />
        Tasdiq kutayotgan so‘rov yo‘q.
      </div>

      <v-list v-else class="py-0" bg-color="transparent">
        <template v-for="(u, i) in rows" :key="u.id">
          <v-divider v-if="i > 0" />
          <v-list-item class="py-3">
            <div class="d-flex align-center flex-wrap" style="gap: 14px">
              <v-avatar size="40" color="primary" variant="tonal">
                <span class="text-body-2 font-weight-bold">{{ (u.fullName ?? u.email)[0]?.toUpperCase() }}</span>
              </v-avatar>

              <div class="flex-grow-1" style="min-width: 180px">
                <div class="text-body-1 font-weight-medium">{{ u.fullName ?? '—' }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ u.email }}
                  <template v-if="u.hemisId"> · HEMIS ID: {{ u.hemisId }}</template>
                  <template v-if="u.faculty?.name"> · {{ u.faculty.name }}</template>
                </div>
              </div>

              <v-select
                :model-value="chosenRole[u.id] ?? 'ROLE_PSYCHOLOGIST'"
                :items="roleOptions"
                item-title="title"
                item-value="value"
                density="compact"
                hide-details
                variant="outlined"
                style="max-width: 170px"
                @update:model-value="(v: string) => (chosenRole[u.id] = v)"
              />

              <div class="d-flex" style="gap: 8px">
                <v-btn
                  color="primary"
                  variant="flat"
                  size="small"
                  prepend-icon="mdi-check"
                  :loading="busyId === u.id"
                  :disabled="busyId !== null"
                  @click="approve(u)"
                >
                  Tasdiqlash
                </v-btn>
                <v-btn
                  color="error"
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-close"
                  :disabled="busyId !== null"
                  @click="reject(u)"
                >
                  Rad etish
                </v-btn>
              </div>
            </div>
          </v-list-item>
        </template>
      </v-list>
    </v-card>

    <v-snackbar v-model="toastOpen" location="top end" :color="toastColor" timeout="2400">{{ toast }}</v-snackbar>
  </div>
</template>
