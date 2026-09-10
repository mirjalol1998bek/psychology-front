<script setup lang="ts">
import { ref, computed } from 'vue'
import { INSTRUMENT_META } from '@/utils/instruments'
import { api } from '@/services/apiClient'
import { members, instrumentForAlgo } from '@/services/quizService'
import type { InstrumentType } from '@/types/domain'

interface Row {
  id: number
  categoryName: string
  instrumentType: InstrumentType
  groupId: number | null
  facultyId: number | null
  groupName: string
  facultyName: string
  startAt: string
  endAt: string
  isActive: boolean
}

const assignments = ref<Row[]>([])
const loading = ref(true)

interface BackendAssignment {
  id: number
  category?: { name?: string; instrumentType?: string } | null
  groupId?: number | null
  facultyId?: number | null
  groupName?: string | null
  facultyName?: string | null
  startAt?: string | null
  endAt?: string | null
  isActive?: boolean
}

function fmtDate(iso?: string | null): string {
  return iso ? iso.slice(0, 10) : '—'
}

async function load() {
  loading.value = true
  try {
    assignments.value = members<BackendAssignment>((await api.get('/assignments')).data).map((a) => ({
      id: a.id,
      categoryName: a.category?.name ?? '—',
      instrumentType: instrumentForAlgo(a.category?.instrumentType),
      groupId: a.groupId ?? null,
      facultyId: a.facultyId ?? null,
      groupName: a.groupName ?? '—',
      facultyName: a.facultyName ?? '',
      startAt: fmtDate(a.startAt),
      endAt: fmtDate(a.endAt),
      isActive: !!a.isActive,
    }))
  } finally {
    loading.value = false
  }
}
load()

const toDelete = ref<Row | null>(null)
const deleting = ref(false)
const toast = ref('')
const toastOpen = ref(false)

function notify(msg: string) {
  toast.value = msg
  toastOpen.value = true
}

async function confirmRemove() {
  const row = toDelete.value
  if (!row || deleting.value) return
  deleting.value = true
  try {
    await api.delete(`/assignments/${row.id}`)
    assignments.value = assignments.value.filter((a) => a.id !== row.id)
    toDelete.value = null
    notify('Biriktirish o‘chirildi')
  } catch {
    notify('O‘chirib bo‘lmadi — qaytadan urinib ko‘ring')
  } finally {
    deleting.value = false
  }
}

const categoryFilter = ref<InstrumentType | 'all'>('all')
const search = ref('')

const filtered = computed(() =>
  assignments.value.filter((a) => {
    if (categoryFilter.value !== 'all' && a.instrumentType !== categoryFilter.value) return false
    if (search.value && !a.groupName.toLowerCase().includes(search.value.toLowerCase())) return false
    return true
  }),
)
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between page-head flex-wrap" style="gap: 12px">
      <div>
        <h1 class="text-h4">Biriktirilgan guruhlar</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">{{ assignments.length }} ta faol va o‘tgan tayinlash</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" to="/assignments/create">Yangi biriktirish</v-btn>
    </div>

    <div class="d-flex flex-wrap align-center mb-4" style="gap: 8px">
      <v-chip :variant="categoryFilter === 'all' ? 'flat' : 'tonal'" :color="categoryFilter === 'all' ? 'primary' : undefined" @click="categoryFilter = 'all'">
        Barchasi
      </v-chip>
      <v-chip
        v-for="[key, meta] in Object.entries(INSTRUMENT_META)" :key="key"
        :variant="categoryFilter === key ? 'flat' : 'tonal'" :color="categoryFilter === key ? 'primary' : undefined"
        @click="categoryFilter = key as InstrumentType"
      >
        {{ meta.label }}
      </v-chip>
      <v-spacer />
      <v-text-field v-model="search" density="compact" variant="solo-filled" rounded="lg" hide-details flat bg-color="surface-variant" prepend-inner-icon="mdi-magnify" placeholder="Guruh qidirish..." style="max-width: 220px" class="app-search" />
    </div>

    <v-card class="surface-card" rounded="lg">
      <v-table>
        <thead>
          <tr>
            <th>Metodika</th>
            <th>Guruh</th>
            <th>Boshlanishi</th>
            <th>Tugashi</th>
            <th>Holati</th>
            <th class="text-right">Amallar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in filtered" :key="a.id">
            <td class="d-flex align-center py-3" style="gap: 10px">
              <div class="icon-tile" style="--tint: rgb(var(--v-theme-primary)); width: 34px; height: 34px">
                <v-icon :icon="INSTRUMENT_META[a.instrumentType].icon" size="17" />
              </div>
              <span class="font-weight-bold">{{ a.categoryName }}</span>
            </td>
            <td><v-chip size="small" variant="tonal" color="secondary">{{ a.groupName }}</v-chip></td>
            <td>{{ a.startAt }}</td>
            <td>{{ a.endAt }}</td>
            <td>
              <v-chip size="small" variant="tonal" :color="a.isActive ? 'success' : undefined">
                {{ a.isActive ? 'Faol' : 'Nofaol' }}
              </v-chip>
            </td>
            <td class="text-right">
              <v-btn :to="`/results/${INSTRUMENT_META[a.instrumentType].routeSegment}/${a.facultyId}/${a.groupId}`" icon="mdi-chart-box-outline" variant="text" size="small" color="secondary" />
              <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" @click="toDelete = a" />
            </td>
          </tr>
        </tbody>
      </v-table>
      <v-empty-state v-if="!filtered.length" icon="mdi-clipboard-off-outline" title="Tayinlash topilmadi" density="compact" />
    </v-card>

    <v-dialog :model-value="toDelete !== null" max-width="420" @update:model-value="toDelete = null">
      <v-card class="surface-card pa-5" rounded="lg">
        <div class="text-h6 font-weight-bold mb-2">Biriktirishni o‘chirasizmi?</div>
        <p class="text-body-2 text-medium-emphasis mb-4">
          <strong>{{ toDelete?.categoryName }}</strong> — <strong>{{ toDelete?.groupName }}</strong> guruhidan olib tashlanadi.
          Talabalar allaqachon topshirgan bo‘lsa, ularning natijalari saqlanadi.
        </p>
        <div class="d-flex justify-end" style="gap: 8px">
          <v-btn variant="text" @click="toDelete = null">Bekor qilish</v-btn>
          <v-btn color="error" variant="flat" :loading="deleting" @click="confirmRemove">O‘chirish</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="toastOpen" location="top end" timeout="2800">{{ toast }}</v-snackbar>
  </div>
</template>
