<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/services/apiClient'
import { members } from '@/services/quizService'
import type { QuestionType, StudyLanguage } from '@/types/domain'

const route = useRoute()
const router = useRouter()
const isEditing = computed(() => route.params.id !== undefined)

const QUESTION_TYPES: { value: QuestionType; label: string; icon: string }[] = [
  { value: 'SINGLE_CHOICE', label: 'Bitta javob (matn)', icon: 'mdi-radiobox-marked' },
  { value: 'MULTI_SELECT', label: 'Ko‘p javob (matn)', icon: 'mdi-checkbox-multiple-marked-outline' },
  { value: 'YES_NO', label: 'Ha / Yo‘q', icon: 'mdi-thumbs-up-down-outline' },
  { value: 'FIGURE', label: 'Figura tanlash', icon: 'mdi-shape-outline' },
  { value: 'SINGLE_CHOICE_IMAGE', label: 'Bitta javob (rasm)', icon: 'mdi-image-multiple-outline' },
  { value: 'SCALE', label: 'Shkala (ball)', icon: 'mdi-gauge' },
  { value: 'WRITING', label: 'Erkin matn', icon: 'mdi-text-long' },
]
const OPTION_TYPES: QuestionType[] = ['SINGLE_CHOICE', 'MULTI_SELECT', 'FIGURE']

interface Category {
  id: string
  name: string
}
const CATEGORIES = ref<Category[]>([])
const langOptions: { title: string; value: StudyLanguage }[] = [
  { title: 'O‘zbek', value: 'uz' },
  { title: 'Rus', value: 'ru' },
]
const studyLanguage = ref<StudyLanguage>('uz')

async function loadCategories() {
  CATEGORIES.value = members<{ id: number; name: string }>((await api.get('/categories')).data).map((c) => ({
    id: String(c.id),
    name: c.name,
  }))
}
loadCategories()

interface OptionDraft {
  id: string
  text: string
  score: number
  imageUrl?: string
  /** Metodika ballash uchun — UI'da tahrirlanmaydi, saqlashda saqlanadi. */
  categoryKey?: string | null
}
interface QuestionDraft {
  id: string
  type: QuestionType
  text: string
  options: OptionDraft[]
  imageUrl?: string | null
  isReversed?: boolean
}

let uid = 0
const nextId = () => `d${++uid}`

const title = ref('')
const categoryId = ref<string | null>(null)
const timeLimit = ref(20)
const description = ref('')
const isActive = ref(true)
const newCategoryDialog = ref(false)
const newCategoryName = ref('')
const newCategoryType = ref('SCORE_SCALE')
const savingCategory = ref(false)
const categoryTypeOptions = [
  { title: 'Ball shkalasi (yig‘indi → oraliq)', value: 'SCORE_SCALE' },
  { title: 'Temperament — bayonotlar (Ha/Yo‘q)', value: 'TEMPERAMENT_STATEMENTS' },
  { title: 'Temperament — variant tanlash', value: 'TEMPERAMENT_CHOICE' },
  { title: 'Figura tanlash', value: 'FIGURE_CHOICE' },
]

const questions = ref<QuestionDraft[]>([
  {
    id: nextId(),
    type: 'SINGLE_CHOICE',
    text: '',
    options: [
      { id: nextId(), text: '', score: 0 },
      { id: nextId(), text: '', score: 0 },
    ],
  },
])

function addQuestion() {
  questions.value.push({ id: nextId(), type: 'SINGLE_CHOICE', text: '', options: [{ id: nextId(), text: '', score: 0 }, { id: nextId(), text: '', score: 0 }] })
}
function removeQuestion(id: string) {
  questions.value = questions.value.filter((q) => q.id !== id)
}
function addOption(q: QuestionDraft) {
  q.options.push({ id: nextId(), text: '', score: 0 })
}
function removeOption(q: QuestionDraft, optId: string) {
  q.options = q.options.filter((o) => o.id !== optId)
}
function onImagePick(opt: OptionDraft, e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) opt.imageUrl = URL.createObjectURL(file)
}
function onTypeChange(q: QuestionDraft) {
  if (q.type === 'YES_NO') {
    q.options = [
      { id: nextId(), text: 'Ha', score: 1 },
      { id: nextId(), text: 'Yo‘q', score: 0 },
    ]
  } else if (q.type === 'WRITING') {
    q.options = []
  } else if (!q.options.length) {
    q.options = [{ id: nextId(), text: '', score: 0 }, { id: nextId(), text: '', score: 0 }]
  }
}

// --- Edit mode: load the existing quiz + its questions ---------------------
interface BackendOption {
  id: number
  text: string
  score?: number
  imageUrl?: string | null
  position?: number
  categoryKey?: string | null
}
interface BackendQuestion {
  id: number
  type: QuestionType
  text: string
  imageUrl?: string | null
  position?: number
  isReversed?: boolean
  options?: BackendOption[]
}
interface BackendQuizFull {
  title?: string
  description?: string | null
  studyLanguage?: StudyLanguage
  timeLimitMinutes?: number
  isActive?: boolean
  category?: { id?: number } | null
  questions?: BackendQuestion[]
}

const loadingQuiz = ref(isEditing.value)
const loadError = ref('')
let originalQuestionIds: number[] = []

async function loadExisting() {
  try {
    const bq = (await api.get(`/quizzes/${route.params.id}`)).data as BackendQuizFull
    title.value = bq.title ?? ''
    categoryId.value = bq.category?.id != null ? String(bq.category.id) : null
    timeLimit.value = bq.timeLimitMinutes ?? 0
    description.value = bq.description ?? ''
    isActive.value = bq.isActive ?? true
    studyLanguage.value = (bq.studyLanguage ?? 'uz') as StudyLanguage

    const loaded = [...(bq.questions ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    originalQuestionIds = loaded.map((q) => q.id)

    if (loaded.length) {
      questions.value = loaded.map((q) => ({
        id: nextId(),
        type: q.type,
        text: q.text ?? '',
        imageUrl: q.imageUrl ?? null,
        isReversed: !!q.isReversed,
        options: [...(q.options ?? [])]
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map((o) => ({
            id: nextId(),
            text: o.text ?? '',
            score: o.score ?? 0,
            imageUrl: o.imageUrl ?? undefined,
            categoryKey: o.categoryKey ?? null,
          })),
      }))
    }
  } catch {
    loadError.value = 'Testni yuklab bo‘lmadi.'
  } finally {
    loadingQuiz.value = false
  }
}
if (isEditing.value) loadExisting()

async function createCategory() {
  if (!newCategoryName.value.trim() || savingCategory.value) return
  savingCategory.value = true
  try {
    const { data } = await api.post('/categories', {
      name: newCategoryName.value.trim(),
      instrumentType: newCategoryType.value,
      position: CATEGORIES.value.length + 1,
    })
    const created = { id: String(data.id), name: data.name as string }
    CATEGORIES.value.push(created)
    categoryId.value = created.id
    newCategoryName.value = ''
    newCategoryDialog.value = false
  } finally {
    savingCategory.value = false
  }
}

const categoryName = computed(() => CATEGORIES.value.find((c) => c.id === categoryId.value)?.name ?? '—')
function typeLabel(t: QuestionType) {
  return QUESTION_TYPES.find((q) => q.value === t)?.label ?? t
}

// ---------------------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------------------
const STEPS = [
  { n: 1, title: 'Test ma’lumotlari', icon: 'mdi-information-outline' },
  { n: 2, title: 'Savollar', icon: 'mdi-help-circle-outline' },
  { n: 3, title: 'Ko‘rinish', icon: 'mdi-eye-outline' },
  { n: 4, title: 'Nashr', icon: 'mdi-cloud-upload-outline' },
]
const step = ref(1)
const stepError = ref('')

function goStep(n: number) {
  if (n > step.value && !validateStep(step.value)) return
  if (n < step.value || n <= step.value + 1) step.value = n
}
function validateStep(n: number): boolean {
  stepError.value = ''
  if (n === 1) {
    if (!title.value.trim() || !categoryId.value) {
      stepError.value = 'Test nomi va kategoriyani to‘ldiring.'
      return false
    }
  }
  if (n === 2) {
    const bad = questions.value.some((q) => !q.text.trim() || (q.type !== 'WRITING' && q.options.some((o) => !o.text.trim() && !o.imageUrl)))
    if (bad) {
      stepError.value = 'Barcha savol va javob maydonlarini to‘ldiring.'
      return false
    }
  }
  return true
}
function next() {
  if (!validateStep(step.value)) return
  step.value = Math.min(4, step.value + 1)
}
function back() {
  stepError.value = ''
  if (step.value === 1) router.push('/tests')
  else step.value -= 1
}

const saving = ref(false)
const toastOpen = ref(false)
const publishError = ref('')

async function publish() {
  if (!categoryId.value || saving.value) return
  saving.value = true
  publishError.value = ''
  try {
    const quizFields = {
      category: `/api/categories/${categoryId.value}`,
      title: title.value.trim(),
      description: description.value || null,
      studyLanguage: studyLanguage.value,
      timeLimitMinutes: timeLimit.value || 0,
      isActive: isActive.value,
    }

    const quizId = isEditing.value
      ? await updateQuiz(Number(route.params.id), quizFields)
      : (await api.post('/quizzes', quizFields)).data.id

    await writeQuestions(quizId)

    toastOpen.value = true
    setTimeout(() => router.push('/tests'), 900)
  } catch {
    publishError.value = 'Saqlashda xatolik yuz berdi.'
  } finally {
    saving.value = false
  }
}

/** Edit: patch scalar fields, then drop the old questions (recreated below). */
async function updateQuiz(quizId: number, fields: Record<string, unknown>): Promise<number> {
  await api.patch(`/quizzes/${quizId}`, fields, {
    headers: { 'Content-Type': 'application/merge-patch+json' },
  })

  for (const id of originalQuestionIds) {
    await api.delete(`/questions/${id}`).catch((e: unknown) => {
      // A question already gone (e.g. a retried save) is fine.
      if ((e as { response?: { status?: number } })?.response?.status !== 404) {
        throw e
      }
    })
  }
  originalQuestionIds = []

  return quizId
}

async function writeQuestions(quizId: number): Promise<void> {
  let position = 0

  for (const q of questions.value) {
    position++
    await api.post('/questions', {
      quiz: `/api/quizzes/${quizId}`,
      type: q.type,
      text: q.text.trim(),
      imageUrl: q.imageUrl || null,
      isReversed: q.isReversed ?? false,
      position,
      options: q.options.map((o, i) => ({
        text: o.text.trim(),
        score: o.score || 0,
        position: i,
        imageUrl: o.imageUrl || null,
        categoryKey: o.categoryKey || null,
      })),
    })
  }
}
</script>

<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" class="text-none mb-2" @click="router.push('/tests')">Orqaga</v-btn>
    <h1 class="text-display text-h4 font-weight-bold mb-6">{{ isEditing ? 'Testni tahrirlash' : 'Yangi test yaratish' }}</h1>

    <div v-if="loadingQuiz" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" size="40" />
    </div>
    <v-alert v-else-if="loadError" type="error" variant="tonal" class="mb-4">{{ loadError }}</v-alert>

    <template v-else>
    <!-- Stepper header -->
    <div class="stepper-head mb-8">
      <template v-for="(s, i) in STEPS" :key="s.n">
        <button class="stepper-node" :class="{ 'stepper-node--done': step > s.n, 'stepper-node--active': step === s.n }" @click="goStep(s.n)">
          <span class="stepper-circle">
            <v-icon v-if="step > s.n" icon="mdi-check" size="16" />
            <span v-else>{{ s.n }}</span>
          </span>
          <span class="stepper-label d-none d-sm-inline">{{ s.title }}</span>
        </button>
        <div v-if="i < STEPS.length - 1" class="stepper-line" :class="{ 'stepper-line--done': step > s.n }" />
      </template>
    </div>

    <v-alert v-if="stepError" type="error" variant="tonal" density="compact" class="mb-4">{{ stepError }}</v-alert>

    <!-- Step 1: Test ma'lumotlari -->
    <v-card v-if="step === 1" class="surface-card pa-5" rounded="lg">
      <div class="text-subtitle-1 font-weight-bold mb-4">Test ma’lumotlari</div>
      <v-row>
        <v-col cols="12" md="7">
          <v-text-field v-model="title" label="Test nomi" density="comfortable" />
        </v-col>
        <v-col cols="12" md="5">
          <div class="d-flex" style="gap: 8px">
            <v-select v-model="categoryId" :items="CATEGORIES" item-title="name" item-value="id" label="Kategoriya" density="comfortable" />
            <v-btn icon="mdi-plus" variant="tonal" color="primary" class="mt-1" @click="newCategoryDialog = true" />
          </div>
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field v-model.number="timeLimit" type="number" label="Vaqt chegarasi (daqiqa, 0 = cheklanmagan)" density="comfortable" />
        </v-col>
        <v-col cols="12" md="4">
          <v-select v-model="studyLanguage" :items="langOptions" item-title="title" item-value="value" label="Ta’lim tili" density="comfortable" />
        </v-col>
        <v-col cols="12" md="8">
          <v-textarea v-model="description" label="Test tavsifi" rows="2" density="comfortable" />
        </v-col>
        <v-col cols="12">
          <v-checkbox v-model="isActive" label="Test faol" density="comfortable" hide-details />
        </v-col>
      </v-row>
    </v-card>

    <!-- Step 2: Savollar -->
    <v-card v-else-if="step === 2" class="surface-card pa-5" rounded="lg">
      <div class="d-flex align-center justify-space-between mb-4">
        <span class="text-subtitle-1 font-weight-bold">Savollar ({{ questions.length }})</span>
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-plus" class="text-none" @click="addQuestion">Savol qo‘shish</v-btn>
      </div>

      <v-card v-for="(q, qi) in questions" :key="q.id" class="pa-4 mb-4 question-card" rounded="lg">
        <div class="d-flex align-center justify-space-between mb-3">
          <span class="text-body-2 font-weight-bold">Savol {{ qi + 1 }}</span>
          <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" :disabled="questions.length === 1" @click="removeQuestion(q.id)" />
        </div>

        <v-row>
          <v-col cols="12" md="4">
            <v-select v-model="q.type" :items="QUESTION_TYPES" item-title="label" item-value="value" label="Savol turi" density="comfortable" @update:model-value="onTypeChange(q)" />
          </v-col>
          <v-col cols="12" md="8">
            <v-textarea v-model="q.text" label="Savol matni" rows="1" density="comfortable" auto-grow />
          </v-col>
        </v-row>

        <!-- YES_NO -->
        <v-row v-if="q.type === 'YES_NO'" class="mt-1">
          <v-col v-for="opt in q.options" :key="opt.id" cols="6">
            <v-text-field :model-value="opt.text" readonly density="compact" :label="opt.text" />
            <v-text-field v-model.number="opt.score" type="number" density="compact" label="Ball" />
          </v-col>
        </v-row>

        <!-- SINGLE_CHOICE / MULTI_SELECT / FIGURE / SCALE — matnli variantlar -->
        <div v-else-if="OPTION_TYPES.includes(q.type) || q.type === 'SCALE'" class="mt-1">
          <div v-for="opt in q.options" :key="opt.id" class="d-flex align-center mb-2" style="gap: 8px">
            <v-icon :icon="q.type === 'MULTI_SELECT' ? 'mdi-checkbox-blank-outline' : 'mdi-circle-outline'" size="18" class="text-medium-emphasis" />
            <v-text-field v-model="opt.text" placeholder="Javob matni" density="compact" hide-details style="flex: 2" />
            <v-text-field v-model.number="opt.score" type="number" placeholder="Ball" density="compact" hide-details style="max-width: 90px" />
            <v-btn icon="mdi-close" variant="text" size="x-small" :disabled="q.options.length <= 2" @click="removeOption(q, opt.id)" />
          </div>
          <div v-if="q.options.some((o) => o.categoryKey)" class="text-caption text-medium-emphasis mb-2">
            <v-icon icon="mdi-tag-outline" size="13" class="mr-1" />Bu savol metodika kalitlariga bog‘langan — kalitlar saqlanadi.
          </div>
          <v-btn variant="text" size="small" color="primary" prepend-icon="mdi-plus" class="text-none" @click="addOption(q)">Variant qo‘shish</v-btn>
        </div>

        <!-- SINGLE_CHOICE_IMAGE -->
        <div v-else-if="q.type === 'SINGLE_CHOICE_IMAGE'" class="mt-1">
          <v-row>
            <v-col v-for="opt in q.options" :key="opt.id" cols="6" sm="4" md="3">
              <v-card class="pa-2 text-center image-option" rounded="lg">
                <div class="image-drop mb-2">
                  <img v-if="opt.imageUrl" :src="opt.imageUrl" alt="" />
                  <v-icon v-else icon="mdi-image-plus-outline" size="26" class="text-medium-emphasis" />
                </div>
                <input type="file" accept="image/*" class="mb-2" style="font-size: 11px" @change="onImagePick(opt, $event)" />
                <v-text-field v-model.number="opt.score" type="number" placeholder="Ball" density="compact" hide-details />
                <v-btn variant="text" size="x-small" color="error" class="mt-1" :disabled="q.options.length <= 2" @click="removeOption(q, opt.id)">O‘chirish</v-btn>
              </v-card>
            </v-col>
            <v-col cols="6" sm="4" md="3" class="d-flex align-center justify-center">
              <v-btn variant="tonal" color="primary" icon="mdi-plus" @click="addOption(q)" />
            </v-col>
          </v-row>
        </div>

        <!-- WRITING -->
        <div v-else class="mt-1">
          <v-textarea disabled placeholder="Talaba erkin matn kiritadi..." rows="2" density="comfortable" />
        </div>
      </v-card>

      <v-btn variant="tonal" color="primary" prepend-icon="mdi-plus" class="text-none" block @click="addQuestion">Savol qo‘shish</v-btn>
    </v-card>

    <!-- Step 3: Ko'rinish (talaba tomonidan qanday ko'rinishi) -->
    <v-card v-else-if="step === 3" class="surface-card pa-5" rounded="lg">
      <div class="text-subtitle-1 font-weight-bold mb-1">Ko‘rinish</div>
      <p class="text-caption text-medium-emphasis mb-4">Test talabaga qanday ko‘rinishini oldindan tekshiring.</p>

      <v-card class="pa-5 mb-5 preview-hero" rounded="lg">
        <v-chip size="small" variant="tonal" color="secondary" class="mb-2">{{ categoryName }}</v-chip>
        <div class="text-h6 font-weight-bold">{{ title || 'Test nomi kiritilmagan' }}</div>
        <p class="text-body-2 text-medium-emphasis mb-2">{{ description || 'Tavsif kiritilmagan.' }}</p>
        <span class="text-caption text-medium-emphasis">
          <v-icon icon="mdi-clock-outline" size="14" class="mr-1" />{{ timeLimit || 'cheklanmagan' }}
          {{ timeLimit ? 'daqiqa' : '' }} · {{ questions.length }} savol
        </span>
      </v-card>

      <div v-for="(q, qi) in questions" :key="q.id" class="mb-5">
        <div class="d-flex align-start mb-2" style="gap: 10px">
          <span class="preview-qnum">{{ qi + 1 }}</span>
          <div>
            <span class="text-body-1 font-weight-bold d-block">{{ q.text || '(savol matni kiritilmagan)' }}</span>
            <span class="text-caption text-medium-emphasis">{{ typeLabel(q.type) }}</span>
          </div>
        </div>

        <div v-if="q.type === 'SINGLE_CHOICE_IMAGE'" class="d-flex flex-wrap" style="gap: 10px; padding-left: 34px">
          <div v-for="opt in q.options" :key="opt.id" class="preview-img-opt">
            <img v-if="opt.imageUrl" :src="opt.imageUrl" alt="" />
            <v-icon v-else icon="mdi-image-outline" size="22" class="text-medium-emphasis" />
          </div>
        </div>
        <div v-else-if="q.type !== 'WRITING'" class="d-flex flex-column" style="gap: 6px; padding-left: 34px">
          <div v-for="opt in q.options" :key="opt.id" class="preview-option">
            <v-icon :icon="q.type === 'SINGLE_CHOICE' || q.type === 'YES_NO' ? 'mdi-circle-outline' : 'mdi-checkbox-blank-outline'" size="16" class="mr-2 text-medium-emphasis" />
            {{ opt.text }}
          </div>
        </div>
        <div v-else class="text-caption text-medium-emphasis" style="padding-left: 34px">Erkin matn javobi kutiladi...</div>
      </div>
    </v-card>

    <!-- Step 4: Nashr -->
    <v-card v-else class="surface-card pa-6 text-center" rounded="lg">
      <div class="gradient-accent icon-badge mx-auto mb-4" style="width: 56px; height: 56px; border-radius: 18px">
        <v-icon icon="mdi-cloud-upload-outline" color="white" size="28" />
      </div>
      <div class="text-h5 font-weight-bold mb-1">{{ isEditing ? 'O‘zgarishlarni saqlash' : 'Nashr qilishga tayyor' }}</div>
      <p class="text-body-2 text-medium-emphasis mb-6">Ma’lumotlarni tekshirib, testni faollashtiring.</p>

      <div class="publish-summary mx-auto mb-6">
        <div class="d-flex justify-space-between py-2"><span class="text-medium-emphasis">Test nomi</span><span class="font-weight-bold">{{ title }}</span></div>
        <v-divider opacity="0.1" />
        <div class="d-flex justify-space-between py-2"><span class="text-medium-emphasis">Kategoriya</span><span class="font-weight-bold">{{ categoryName }}</span></div>
        <v-divider opacity="0.1" />
        <div class="d-flex justify-space-between py-2"><span class="text-medium-emphasis">Savollar soni</span><span class="font-weight-bold">{{ questions.length }}</span></div>
        <v-divider opacity="0.1" />
        <div class="d-flex justify-space-between py-2"><span class="text-medium-emphasis">Vaqt chegarasi</span><span class="font-weight-bold">{{ timeLimit || 'cheklanmagan' }} daqiqa</span></div>
        <v-divider opacity="0.1" />
        <div class="d-flex justify-space-between py-2">
          <span class="text-medium-emphasis">Holat</span>
          <v-chip size="small" variant="tonal" :color="isActive ? 'success' : undefined">{{ isActive ? 'Faol' : 'Nofaol' }}</v-chip>
        </div>
      </div>

      <v-alert v-if="publishError" type="error" variant="tonal" density="compact" class="mb-4 mx-auto" style="max-width: 380px">
        {{ publishError }}
      </v-alert>
      <v-btn color="primary" size="x-large" class="text-none font-weight-bold" :loading="saving" @click="publish">
        <v-icon icon="mdi-check" start />{{ isEditing ? 'Saqlash' : 'Nashr qilish' }}
      </v-btn>
    </v-card>

    <div class="d-flex justify-space-between mt-5">
      <v-btn variant="text" class="text-none" prepend-icon="mdi-arrow-left" @click="back">
        {{ step === 1 ? 'Bekor qilish' : 'Orqaga' }}
      </v-btn>
      <v-btn v-if="step < 4" color="primary" variant="flat" class="text-none" append-icon="mdi-arrow-right" @click="next">Keyingi</v-btn>
    </div>
    </template>

    <v-dialog v-model="newCategoryDialog" max-width="420">
      <v-card class="surface-card pa-5" rounded="lg">
        <div class="text-subtitle-1 font-weight-bold mb-3">Yangi kategoriya (metodika)</div>
        <v-text-field v-model="newCategoryName" label="Kategoriya nomi" density="comfortable" />
        <v-select
          v-model="newCategoryType"
          :items="categoryTypeOptions"
          item-title="title"
          item-value="value"
          label="Ballash turi"
          density="comfortable"
        />
        <div class="d-flex justify-end mt-2" style="gap: 8px">
          <v-btn variant="text" class="text-none" @click="newCategoryDialog = false">Bekor qilish</v-btn>
          <v-btn color="primary" variant="flat" class="text-none" :loading="savingCategory" @click="createCategory">Yaratish</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="toastOpen" location="top end" color="success" timeout="2500">Test muvaffaqiyatli saqlandi</v-snackbar>
  </div>
</template>

<style scoped>
.question-card {
  background: rgb(var(--v-theme-surface-variant)) !important;
  border: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.6));
  box-shadow: none;
}
.image-option {
  background: rgb(var(--v-theme-surface-variant)) !important;
  border: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.6));
  box-shadow: none;
}
.image-drop {
  height: 70px;
  border-radius: 10px;
  border: 1px dashed rgba(var(--v-border-color), 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.image-drop img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Stepper */
.stepper-head {
  display: flex;
  align-items: center;
}
.stepper-node {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  color: inherit;
  padding: 0;
  flex-shrink: 0;
}
.stepper-circle {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  background: rgb(var(--v-theme-surface-variant));
  border: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
  flex-shrink: 0;
}
.stepper-node--active .stepper-circle {
  background: rgb(var(--v-theme-primary));
  border-color: transparent;
  color: rgb(var(--v-theme-on-primary));
}
.stepper-node--done .stepper-circle {
  background: rgb(var(--v-theme-success));
  border-color: transparent;
  color: #fff;
}
.stepper-label {
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.55;
  white-space: nowrap;
}
.stepper-node--active .stepper-label {
  opacity: 1;
}
.stepper-line {
  flex: 1;
  height: 2px;
  background: rgba(var(--v-border-color), var(--v-border-opacity));
  margin: 0 12px;
}
.stepper-line--done {
  background: rgb(var(--v-theme-success));
}

/* Preview */
.preview-hero {
  background: rgb(var(--v-theme-surface-variant)) !important;
  border: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.6));
  box-shadow: none;
}
.preview-qnum {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.14);
  color: rgb(var(--v-theme-primary));
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.preview-option {
  display: flex;
  align-items: center;
  font-size: 14px;
}
.preview-img-opt {
  width: 76px;
  height: 76px;
  border-radius: 10px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.preview-img-opt img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.publish-summary {
  max-width: 380px;
}
</style>
