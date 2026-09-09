<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { INSTRUMENT_META } from '@/utils/instruments'
import { listInstruments, members, instrumentForAlgo } from '@/services/quizService'
import { getAttempts } from '@/services/attemptService'
import { api } from '@/services/apiClient'
import type { InstrumentType, StudyLanguage } from '@/types/domain'
import type { StoredAttempt } from '@/types/assessment'

const auth = useAuthStore()

interface QuizRow {
  id: number
  categoryId: number
  instrumentType: InstrumentType
  title: string
  description: string
  timeLimitMinutes: number
  isActive: boolean
  questionCount: number
}

const quizzes = ref<QuizRow[]>([])

interface BackendQuiz {
  id: number
  title: string
  description?: string | null
  timeLimitMinutes?: number
  isActive?: boolean
  questionCount?: number
  category?: { id?: number; instrumentType?: string } | null
}

async function loadStaff() {
  quizzes.value = members<BackendQuiz>((await api.get('/quizzes')).data).map((q) => ({
    id: q.id,
    categoryId: q.category?.id ?? 0,
    instrumentType: instrumentForAlgo(q.category?.instrumentType),
    title: q.title,
    description: q.description ?? '',
    timeLimitMinutes: q.timeLimitMinutes ?? 0,
    isActive: !!q.isActive,
    questionCount: q.questionCount ?? 0,
  }))
}
if (auth.isStaff) loadStaff()

async function removeQuiz(id: number) {
  await api.delete(`/quizzes/${id}`)
  quizzes.value = quizzes.value.filter((q) => q.id !== id)
}

const categoryFilter = ref<InstrumentType | 'all'>('all')
const search = ref('')

const filtered = computed(() =>
  quizzes.value.filter((q) => {
    if (categoryFilter.value !== 'all' && q.instrumentType !== categoryFilter.value) return false
    if (search.value && !q.title.toLowerCase().includes(search.value.toLowerCase())) return false
    return true
  }),
)

const stats = computed(() => [
  { label: 'Jami testlar', value: quizzes.value.length, icon: 'mdi-clipboard-text-outline', tint: 'rgb(var(--v-theme-primary))' },
  { label: 'Faol testlar', value: quizzes.value.filter((q) => q.isActive).length, icon: 'mdi-check-circle-outline', tint: 'rgb(var(--v-theme-success))' },
  { label: 'Kategoriyalar', value: new Set(quizzes.value.map((q) => q.categoryId)).size, icon: 'mdi-shape-outline', tint: 'rgb(var(--v-theme-secondary))' },
  { label: 'Jami savollar', value: quizzes.value.reduce((s, q) => s + q.questionCount, 0), icon: 'mdi-help-circle-outline', tint: 'rgb(var(--v-theme-warning))' },
])

// Student-facing: real quiz catalogue + this student's attempts.
const language = computed(() => (auth.user?.hemis.studyLanguage ?? 'uz') as StudyLanguage)
const studentKey = computed(() => auth.user?.hemis.hemisId ?? 'anon')
const instruments = ref<Awaited<ReturnType<typeof listInstruments>>>([])
const attempts = ref<StoredAttempt[]>([])

async function loadStudent() {
  ;[instruments.value, attempts.value] = await Promise.all([
    listInstruments(language.value),
    getAttempts(studentKey.value),
  ])
}
if (!auth.isStaff) loadStudent()

function attemptFor(instrument: InstrumentType) {
  return attempts.value.find((a) => a.instrumentType === instrument)
}

/** Faqat biriktirilgan (yoki talaba allaqachon ishlagan) testlar ko'rinadi. */
const visibleInstruments = computed(() =>
  instruments.value.filter((q) => q.available || attemptFor(q.instrumentType)),
)
</script>

<template>
  <!-- Staff: test management -->
  <div v-if="auth.isStaff">
    <div class="d-flex align-center justify-space-between page-head flex-wrap" style="gap: 12px">
      <div>
        <h1 class="text-h4">Testlar</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">Psixologik metodikalar ro‘yxati va konstruktori.</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" to="/tests/create">Yangi test</v-btn>
    </div>

    <v-row dense>
      <v-col v-for="s in stats" :key="s.label" cols="12" sm="6" md="3">
        <v-card class="pa-4 surface-card h-100" rounded="lg">
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-caption text-medium-emphasis">{{ s.label }}</span>
            <div class="icon-tile" :style="{ '--tint': s.tint }"><v-icon :icon="s.icon" size="20" /></div>
          </div>
          <div class="text-h4 text-display font-weight-bold">{{ s.value }}</div>
        </v-card>
      </v-col>
    </v-row>

    <div class="d-flex flex-wrap align-center mt-6 mb-4" style="gap: 8px">
      <v-chip
        :variant="categoryFilter === 'all' ? 'flat' : 'tonal'"
        :color="categoryFilter === 'all' ? 'primary' : undefined"
        @click="categoryFilter = 'all'"
      >
        Barchasi
      </v-chip>
      <v-chip
        v-for="[key, meta] in Object.entries(INSTRUMENT_META)"
        :key="key"
        :variant="categoryFilter === key ? 'flat' : 'tonal'"
        :color="categoryFilter === key ? 'primary' : undefined"
        @click="categoryFilter = key as InstrumentType"
      >
        {{ meta.label }}
      </v-chip>
      <v-spacer />
      <v-text-field
        v-model="search"
        density="compact"
        variant="solo-filled"
        rounded="lg"
        hide-details
        flat
        bg-color="surface-variant"
        prepend-inner-icon="mdi-magnify"
        placeholder="Test qidirish..."
        style="max-width: 220px"
        class="app-search"
      />
    </div>

    <v-card class="surface-card" rounded="lg">
      <v-table>
        <thead>
          <tr>
            <th>Test nomi</th>
            <th>Kategoriya</th>
            <th>Savollar</th>
            <th>Davomiylik</th>
            <th>Holat</th>
            <th class="text-right">Amallar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="q in filtered" :key="q.id">
            <td class="py-3">
              <div class="font-weight-bold">{{ q.title }}</div>
              <div class="text-caption text-medium-emphasis" style="max-width: 320px">{{ q.description }}</div>
            </td>
            <td><v-chip size="small" variant="tonal" color="secondary">{{ INSTRUMENT_META[q.instrumentType].label }}</v-chip></td>
            <td>{{ q.questionCount }}</td>
            <td>{{ q.timeLimitMinutes }} daqiqa</td>
            <td>
              <v-chip size="small" variant="tonal" :color="q.isActive ? 'success' : undefined">
                {{ q.isActive ? 'Faol' : 'Nofaol' }}
              </v-chip>
            </td>
            <td class="text-right">
              <v-btn :to="`/tests/${q.id}`" icon="mdi-pencil-outline" variant="text" size="small" color="primary" />
              <v-btn v-if="auth.isAdmin" icon="mdi-delete-outline" variant="text" size="small" color="error" @click="removeQuiz(q.id)" />
            </td>
          </tr>
        </tbody>
      </v-table>
      <v-empty-state v-if="!filtered.length" icon="mdi-clipboard-text-off-outline" title="Test topilmadi" density="comfortable" />
    </v-card>
  </div>

  <!-- Student: take / view tests -->
  <div v-else>
    <header class="page-head">
      <h1 class="text-h4">Testlar</h1>
      <p class="text-body-2 text-medium-emphasis mb-0">Sizga tayinlangan psixologik metodikalar.</p>
    </header>

    <v-row>
      <v-col v-for="q in visibleInstruments" :key="q.instrumentType" cols="12" sm="6" lg="4">
        <v-card class="pa-5 h-100 d-flex flex-column surface-card" rounded="lg">
          <div class="d-flex align-start justify-space-between mb-4">
            <div class="icon-tile" style="--tint: rgb(var(--v-theme-primary))">
              <v-icon :icon="INSTRUMENT_META[q.instrumentType].icon" size="20" />
            </div>
            <v-chip
              v-if="attemptFor(q.instrumentType)?.status === 'submitted'"
              color="success"
              variant="tonal"
              size="small"
              prepend-icon="mdi-check"
            >
              Yakunlangan
            </v-chip>
            <v-chip
              v-else-if="attemptFor(q.instrumentType)?.status === 'in_progress'"
              color="primary"
              variant="tonal"
              size="small"
            >
              Boshlangan
            </v-chip>
            <v-chip v-else-if="!q.available" size="small" variant="tonal">Tez orada</v-chip>
            <v-chip v-else color="warning" variant="tonal" size="small">Kutilmoqda</v-chip>
          </div>

          <div class="text-subtitle-1 font-weight-bold mb-1">{{ q.title }}</div>
          <div class="text-caption text-medium-emphasis mb-3">{{ INSTRUMENT_META[q.instrumentType].label }}</div>
          <p v-if="q.available" class="text-caption text-medium-emphasis mb-0">{{ q.description }}</p>

          <v-spacer />

          <div v-if="q.available" class="text-caption text-medium-emphasis mt-3">
            <v-icon icon="mdi-format-list-numbered" size="14" class="mr-1" />{{ q.itemCount }} ta savol
          </div>

          <v-btn
            v-if="attemptFor(q.instrumentType)?.status === 'submitted'"
            variant="tonal"
            color="primary"
            class="mt-4"
            block
            :to="`/tests/${INSTRUMENT_META[q.instrumentType].routeSegment}/result`"
          >
            Natijani ko‘rish
          </v-btn>
          <v-btn
            v-else-if="q.available"
            variant="flat"
            color="primary"
            class="mt-4"
            block
            :to="`/tests/${INSTRUMENT_META[q.instrumentType].routeSegment}/take`"
          >
            {{ attemptFor(q.instrumentType) ? 'Davom etish' : 'Boshlash' }}
          </v-btn>
          <v-btn v-else variant="tonal" class="mt-4" block disabled>Mavjud emas</v-btn>
        </v-card>
      </v-col>
    </v-row>

    <v-empty-state
      v-if="!visibleInstruments.length"
      icon="mdi-clipboard-text-off-outline"
      title="Sizga hali test biriktirilmagan"
      text="Psixolog test biriktirgach, bu yerda ko‘rinadi."
      density="comfortable"
    />
  </div>
</template>
