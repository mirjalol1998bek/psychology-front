<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { INSTRUMENT_META, instrumentLabel } from '@/utils/instruments'
import { listInstruments, members, instrumentForAlgo } from '@/services/quizService'
import { getAttempts, getAttemptsForQuiz, deleteAttempt, type QuizAttemptRow } from '@/services/attemptService'
import { api } from '@/services/apiClient'
import type { InstrumentType, StudyLanguage } from '@/types/domain'
import type { StoredAttempt } from '@/types/assessment'

const auth = useAuthStore()
const { t } = useI18n()

interface QuizVariant {
  id: number
  studyLanguage: string
  isActive: boolean
  questionCount: number
}

/** Bir metodika (Category) — bir yoki bir nechta til varianti (Quiz) bilan.
 * Temperament tabiatan 2 ALOHIDA metodika (uz/ru algoritmi farqli) — shu
 * sababli u ikki alohida qatorga ega bo'ladi; qolgan hammasi bitta qatorda,
 * til variantlari "Amallar"da yonma-yon ko'rinadi. */
interface CategoryRow {
  categoryId: number
  instrumentType: InstrumentType
  title: string
  description: string
  timeLimitMinutes: number
  isActive: boolean
  questionCount: number
  variants: QuizVariant[]
}

const categoryRows = ref<CategoryRow[]>([])

interface BackendQuiz {
  id: number
  title: string
  description?: string | null
  studyLanguage: string
  timeLimitMinutes?: number
  isActive?: boolean
  questionCount?: number
  category?: { id?: number; name?: string; instrumentType?: string } | null
}

async function loadStaff() {
  const quizzes = members<BackendQuiz>((await api.get('/quizzes')).data)
  const byCategory = new Map<number, CategoryRow>()

  for (const q of quizzes) {
    const categoryId = q.category?.id ?? 0
    const row = byCategory.get(categoryId)
    const variant: QuizVariant = {
      id: q.id,
      studyLanguage: q.studyLanguage,
      isActive: !!q.isActive,
      questionCount: q.questionCount ?? 0,
    }

    if (row) {
      row.variants.push(variant)
      row.questionCount += variant.questionCount
      row.isActive = row.isActive || variant.isActive
    } else {
      byCategory.set(categoryId, {
        categoryId,
        instrumentType: instrumentForAlgo(q.category?.instrumentType),
        title: q.category?.name ?? q.title,
        description: q.description ?? '',
        timeLimitMinutes: q.timeLimitMinutes ?? 0,
        isActive: variant.isActive,
        questionCount: variant.questionCount,
        variants: [variant],
      })
    }
  }

  categoryRows.value = [...byCategory.values()]
}
if (auth.isStaff) loadStaff()

const deleteError = ref('')
const deleteErrorOpen = ref(false)

// --- test o'chirishga to'sqinlik qilgan urinishlarni ko'rsatish/tozalash ---
// Fakultet/guruhni birma-bir tekshirib "kim topshirgan" qidirish o'rniga —
// backend `?quiz=` filtri orqali to'g'ridan-to'g'ri shu test bo'yicha
// urinishlar ro'yxatini olib, shu yerning o'zida o'chirish imkonini beradi.
const attemptDialogOpen = ref(false)
const attemptDialogCategoryId = ref<number | null>(null)
const attemptDialogQuizId = ref<number | null>(null)
const attemptRows = ref<QuizAttemptRow[]>([])
const attemptRowsLoading = ref(false)
const attemptRowBusy = ref<number | null>(null)
const bulkBusy = ref(false)

function removeQuizFromList(categoryId: number, quizId: number) {
  const row = categoryRows.value.find((r) => r.categoryId === categoryId)
  if (!row) return
  row.variants = row.variants.filter((v) => v.id !== quizId)
  if (row.variants.length === 0) categoryRows.value = categoryRows.value.filter((r) => r.categoryId !== categoryId)
}

async function removeQuiz(categoryId: number, quizId: number) {
  if (!confirm('Bu test variantini o‘chirishni tasdiqlaysizmi?')) return
  try {
    await api.delete(`/quizzes/${quizId}`)
  } catch (e) {
    const status = (e as { response?: { status?: number } })?.response?.status
    if (status === 409) {
      attemptDialogCategoryId.value = categoryId
      attemptDialogQuizId.value = quizId
      attemptDialogOpen.value = true
      attemptRowsLoading.value = true
      try {
        attemptRows.value = await getAttemptsForQuiz(quizId)
      } finally {
        attemptRowsLoading.value = false
      }
      return
    }
    const data = (e as { response?: { data?: { detail?: string } } })?.response?.data
    deleteError.value = data?.detail || 'Testni o‘chirib bo‘lmadi.'
    deleteErrorOpen.value = true
    return
  }
  removeQuizFromList(categoryId, quizId)
}

async function removeAttemptRow(id: number) {
  attemptRowBusy.value = id
  try {
    await deleteAttempt(id)
    attemptRows.value = attemptRows.value.filter((a) => a.id !== id)
  } finally {
    attemptRowBusy.value = null
  }
}

async function removeAllAttempts() {
  bulkBusy.value = true
  try {
    for (const a of [...attemptRows.value]) {
      await deleteAttempt(a.id)
      attemptRows.value = attemptRows.value.filter((x) => x.id !== a.id)
    }
  } finally {
    bulkBusy.value = false
  }
}

const ATTEMPT_STATUS_LABEL: Record<QuizAttemptRow['status'], string> = {
  not_started: 'Boshlanmagan',
  in_progress: 'Jarayonda',
  submitted: 'Topshirilgan',
  reviewed: 'Ko‘rib chiqilgan',
}

async function finishQuizDelete() {
  if (attemptDialogQuizId.value == null || attemptDialogCategoryId.value == null) return
  bulkBusy.value = true
  try {
    await api.delete(`/quizzes/${attemptDialogQuizId.value}`)
    removeQuizFromList(attemptDialogCategoryId.value, attemptDialogQuizId.value)
    attemptDialogOpen.value = false
  } catch {
    deleteError.value = 'Testni o‘chirib bo‘lmadi.'
    deleteErrorOpen.value = true
  } finally {
    bulkBusy.value = false
  }
}

const categoryFilter = ref<InstrumentType | 'all'>('all')
const search = ref('')

/** Faqat hozir haqiqatan mavjud (kamida bitta quiz'i bor) metodikalar
 * uchun filtr chipi ko'rinadi — o'chirilgan/bo'shab qolgan kategoriya
 * "ko'rinmas test" chipiga aylanib qolmasligi uchun. */
const availableInstrumentTypes = computed(() => {
  const seen = new Set<InstrumentType>()
  for (const r of categoryRows.value) seen.add(r.instrumentType)
  return (Object.keys(INSTRUMENT_META) as InstrumentType[]).filter((k) => seen.has(k))
})

/** Tanlangan filtr chipi o'chirilgan bo'lsa (masalan shu metodikaning
 * so'nggi til varianti o'chirilganda) — "Barchasi"ga qaytaramiz, aks holda
 * jadval bo'sh ko'rinib, hech qanday chip tanlanmagandek qolib ketardi. */
watch(availableInstrumentTypes, (types) => {
  if (categoryFilter.value !== 'all' && !types.includes(categoryFilter.value)) categoryFilter.value = 'all'
})

const filtered = computed(() =>
  categoryRows.value.filter((r) => {
    if (categoryFilter.value !== 'all' && r.instrumentType !== categoryFilter.value) return false
    if (search.value && !r.title.toLowerCase().includes(search.value.toLowerCase())) return false
    return true
  }),
)

const stats = computed(() => [
  { label: 'Jami testlar', value: categoryRows.value.length, icon: 'mdi-clipboard-text-outline', tint: 'rgb(var(--v-theme-primary))' },
  { label: 'Faol testlar', value: categoryRows.value.filter((r) => r.isActive).length, icon: 'mdi-check-circle-outline', tint: 'rgb(var(--v-theme-success))' },
  { label: 'Til variantlari', value: categoryRows.value.reduce((s, r) => s + r.variants.length, 0), icon: 'mdi-translate', tint: 'rgb(var(--v-theme-secondary))' },
  { label: 'Jami savollar', value: categoryRows.value.reduce((s, r) => s + r.questionCount, 0), icon: 'mdi-help-circle-outline', tint: 'rgb(var(--v-theme-warning))' },
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
        v-for="key in availableInstrumentTypes"
        :key="key"
        :variant="categoryFilter === key ? 'flat' : 'tonal'"
        :color="categoryFilter === key ? 'primary' : undefined"
        @click="categoryFilter = key"
      >
        {{ INSTRUMENT_META[key].label }}
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
          <tr v-for="r in filtered" :key="r.categoryId">
            <td class="py-3">
              <div class="font-weight-bold">{{ r.title }}</div>
              <div class="text-caption text-medium-emphasis" style="max-width: 320px">{{ r.description }}</div>
            </td>
            <td><v-chip size="small" variant="tonal" color="secondary">{{ INSTRUMENT_META[r.instrumentType].label }}</v-chip></td>
            <td>
              <span v-if="r.variants.length > 1" class="text-caption">
                {{ r.variants.map((v) => `${v.questionCount} (${v.studyLanguage})`).join(' · ') }}
              </span>
              <span v-else>{{ r.questionCount }}</span>
            </td>
            <td>{{ r.timeLimitMinutes }} daqiqa</td>
            <td>
              <v-chip size="small" variant="tonal" :color="r.isActive ? 'success' : undefined">
                {{ r.isActive ? 'Faol' : 'Nofaol' }}
              </v-chip>
            </td>
            <td class="text-right">
              <div class="d-flex justify-end align-center flex-wrap" style="gap: 2px">
                <div v-for="v in r.variants" :key="v.id" class="d-flex align-center">
                  <span v-if="r.variants.length > 1" class="text-caption text-medium-emphasis text-uppercase mr-1">{{ v.studyLanguage }}</span>
                  <v-btn :to="`/tests/${v.id}`" icon="mdi-pencil-outline" variant="text" size="small" color="primary" />
                  <v-btn v-if="auth.isAdmin" icon="mdi-delete-outline" variant="text" size="small" color="error" @click="removeQuiz(r.categoryId, v.id)" />
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
      <v-empty-state v-if="!filtered.length" icon="mdi-clipboard-text-off-outline" title="Test topilmadi" density="comfortable" />
    </v-card>

    <v-snackbar v-model="deleteErrorOpen" location="top end" color="error" timeout="4000">{{ deleteError }}</v-snackbar>

    <v-dialog v-model="attemptDialogOpen" max-width="480">
      <v-card class="surface-card pa-6" rounded="lg">
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-1 font-weight-bold">Test allaqachon topshirilgan</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="attemptDialogOpen = false" />
        </div>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Bu testni o‘chirish uchun avval quyidagi talabalarning urinishlarini o‘chiring —
          fakultet/guruhni qidirishga hojat yo‘q, ro‘yxat shu testga tegishli barcha urinishlarni ko‘rsatadi.
        </p>

        <div v-if="attemptRowsLoading" class="d-flex justify-center py-6">
          <v-progress-circular indeterminate color="primary" />
        </div>
        <template v-else>
          <div v-if="!attemptRows.length" class="text-center py-4">
            <v-icon icon="mdi-check-circle-outline" color="success" size="32" class="mb-2" />
            <p class="text-body-2 mb-0">Barcha urinishlar o‘chirildi — testni endi o‘chirish mumkin.</p>
          </div>
          <div v-else style="max-height: 320px; overflow-y: auto">
            <div
              v-for="a in attemptRows"
              :key="a.id"
              class="d-flex align-center justify-space-between py-2"
              style="border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.7))"
            >
              <div>
                <div class="text-body-2 font-weight-medium">{{ a.studentName }}</div>
                <div class="text-caption text-medium-emphasis">{{ ATTEMPT_STATUS_LABEL[a.status] }}</div>
              </div>
              <v-btn
                icon="mdi-delete-outline"
                variant="text"
                size="small"
                color="error"
                :loading="attemptRowBusy === a.id"
                @click="removeAttemptRow(a.id)"
              />
            </div>
          </div>
        </template>

        <div class="d-flex justify-end mt-5" style="gap: 8px">
          <v-btn variant="text" @click="attemptDialogOpen = false">Yopish</v-btn>
          <v-btn
            v-if="attemptRows.length"
            variant="tonal"
            color="error"
            :loading="bulkBusy"
            @click="removeAllAttempts"
          >
            Hammasini o‘chirish
          </v-btn>
          <v-btn v-else color="primary" variant="flat" :loading="bulkBusy" @click="finishQuizDelete">
            Testni o‘chirish
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>

  <!-- Student: take / view tests -->
  <div v-else>
    <header class="page-head">
      <h1 class="text-h4">{{ t('nav.tests') }}</h1>
      <p class="text-body-2 text-medium-emphasis mb-0">{{ t('tests.studentSubtitle') }}</p>
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
              {{ t('tests.completed') }}
            </v-chip>
            <v-chip
              v-else-if="attemptFor(q.instrumentType)?.status === 'in_progress'"
              color="primary"
              variant="tonal"
              size="small"
            >
              {{ t('tests.started') }}
            </v-chip>
            <v-chip v-else-if="!q.available" size="small" variant="tonal">{{ t('tests.comingSoon') }}</v-chip>
            <v-chip v-else color="warning" variant="tonal" size="small">{{ t('tests.pending') }}</v-chip>
          </div>

          <div class="text-subtitle-1 font-weight-bold mb-1">{{ q.title }}</div>
          <div class="text-caption text-medium-emphasis mb-3">{{ instrumentLabel(q.instrumentType) }}</div>
          <p v-if="q.available" class="text-caption text-medium-emphasis mb-0">{{ q.description }}</p>

          <v-spacer />

          <div v-if="q.available" class="text-caption text-medium-emphasis mt-3">
            <v-icon icon="mdi-format-list-numbered" size="14" class="mr-1" />{{ t('tests.questionCount', { n: q.itemCount }) }}
          </div>

          <v-btn
            v-if="attemptFor(q.instrumentType)?.status === 'submitted'"
            variant="tonal"
            color="primary"
            class="mt-4"
            block
            :to="`/tests/${INSTRUMENT_META[q.instrumentType].routeSegment}/result`"
          >
            {{ t('tests.viewResult') }}
          </v-btn>
          <v-btn
            v-else-if="q.available"
            variant="flat"
            color="primary"
            class="mt-4"
            block
            :to="`/tests/${INSTRUMENT_META[q.instrumentType].routeSegment}/take`"
          >
            {{ attemptFor(q.instrumentType) ? t('tests.continue') : t('tests.start') }}
          </v-btn>
          <v-btn v-else variant="tonal" class="mt-4" block disabled>{{ t('tests.notAvailable') }}</v-btn>
        </v-card>
      </v-col>
    </v-row>

    <v-empty-state
      v-if="!visibleInstruments.length"
      icon="mdi-clipboard-text-off-outline"
      :title="t('tests.emptyTitle')"
      :text="t('tests.emptyText')"
      density="comfortable"
    />
  </div>
</template>
