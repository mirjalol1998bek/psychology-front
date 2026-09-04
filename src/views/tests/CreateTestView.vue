<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { QuestionType } from '@/types/domain'

const route = useRoute()
const router = useRouter()
const isEditing = computed(() => route.params.id !== undefined)

const QUESTION_TYPES: { value: QuestionType; label: string; icon: string }[] = [
  { value: 'SINGLE_CHOICE', label: 'Bitta javob (matn)', icon: 'mdi-radiobox-marked' },
  { value: 'MULTI_SELECT', label: 'Ko‘p javob (matn)', icon: 'mdi-checkbox-multiple-marked-outline' },
  { value: 'SINGLE_CHOICE_IMAGE', label: 'Bitta javob (rasm)', icon: 'mdi-image-outline' },
  { value: 'YES_NO', label: 'Ha / Yo‘q', icon: 'mdi-thumbs-up-down-outline' },
  { value: 'WRITING', label: 'Erkin matn', icon: 'mdi-text-long' },
]

const CATEGORIES = [
  { id: 'c1', name: 'Temperament testi' },
  { id: 'c2', name: 'Psixogeometrik test' },
  { id: 'c3', name: 'Nevrasteniya so‘rovnomasi' },
]

interface OptionDraft {
  id: string
  text: string
  score: number
  imageUrl?: string
}
interface QuestionDraft {
  id: string
  type: QuestionType
  text: string
  options: OptionDraft[]
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

const saving = ref(false)
const toastOpen = ref(false)

function createCategory() {
  if (!newCategoryName.value.trim()) return
  CATEGORIES.push({ id: nextId(), name: newCategoryName.value.trim() })
  categoryId.value = CATEGORIES[CATEGORIES.length - 1].id
  newCategoryName.value = ''
  newCategoryDialog.value = false
}

async function saveTest() {
  if (!title.value.trim() || !categoryId.value) {
    window.alert('Test nomi va kategoriyani to‘ldiring.')
    return
  }
  saving.value = true
  // TODO(backend): createQuiz → createQuestion (per question) →
  // createOption / createOptionWithImage (per option), matching the
  // sequential save flow the old create-test.vue already implements (TZ §14).
  await new Promise((r) => setTimeout(r, 700))
  saving.value = false
  toastOpen.value = true
  setTimeout(() => router.push('/tests'), 900)
}
</script>

<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" class="text-none mb-2" @click="router.push('/tests')">Orqaga</v-btn>
    <h1 class="text-display text-h4 font-weight-800 mb-6">{{ isEditing ? 'Testni tahrirlash' : 'Yangi test yaratish' }}</h1>

    <v-card class="surface-glass pa-5 mb-5" rounded="xl">
      <div class="text-subtitle-1 font-weight-700 mb-4">Test ma’lumotlari</div>
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
        <v-col cols="12" md="8">
          <v-textarea v-model="description" label="Test tavsifi" rows="2" density="comfortable" />
        </v-col>
        <v-col cols="12">
          <v-checkbox v-model="isActive" label="Test faol" density="comfortable" hide-details />
        </v-col>
      </v-row>
    </v-card>

    <v-card class="surface-glass pa-5" rounded="xl">
      <div class="d-flex align-center justify-space-between mb-4">
        <span class="text-subtitle-1 font-weight-700">Savollar ({{ questions.length }})</span>
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-plus" class="text-none" @click="addQuestion">Savol qo‘shish</v-btn>
      </div>

      <v-card v-for="(q, qi) in questions" :key="q.id" class="pa-4 mb-4 question-card" rounded="lg">
        <div class="d-flex align-center justify-space-between mb-3">
          <span class="text-body-2 font-weight-700">Savol {{ qi + 1 }}</span>
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

        <!-- SINGLE_CHOICE / MULTI_SELECT -->
        <div v-else-if="q.type === 'SINGLE_CHOICE' || q.type === 'MULTI_SELECT'" class="mt-1">
          <div v-for="opt in q.options" :key="opt.id" class="d-flex align-center mb-2" style="gap: 8px">
            <v-icon :icon="q.type === 'SINGLE_CHOICE' ? 'mdi-circle-outline' : 'mdi-checkbox-blank-outline'" size="18" class="text-medium-emphasis" />
            <v-text-field v-model="opt.text" placeholder="Javob matni" density="compact" hide-details style="flex: 2" />
            <v-text-field v-model.number="opt.score" type="number" placeholder="Ball" density="compact" hide-details style="max-width: 90px" />
            <v-btn icon="mdi-close" variant="text" size="x-small" :disabled="q.options.length <= 2" @click="removeOption(q, opt.id)" />
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

    <div class="d-flex justify-end mt-5" style="gap: 10px">
      <v-btn variant="text" class="text-none" @click="router.push('/tests')">Bekor qilish</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" :loading="saving" @click="saveTest">Saqlash</v-btn>
    </div>

    <v-dialog v-model="newCategoryDialog" max-width="360">
      <v-card class="surface-glass pa-5" rounded="xl">
        <div class="text-subtitle-1 font-weight-700 mb-3">Yangi kategoriya</div>
        <v-text-field v-model="newCategoryName" label="Kategoriya nomi" density="comfortable" />
        <div class="d-flex justify-end mt-2" style="gap: 8px">
          <v-btn variant="text" class="text-none" @click="newCategoryDialog = false">Bekor qilish</v-btn>
          <v-btn color="primary" variant="flat" class="text-none" @click="createCategory">Yaratish</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="toastOpen" location="top end" color="success" timeout="2500">Test muvaffaqiyatli saqlandi</v-snackbar>
  </div>
</template>

<style scoped>
.question-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.image-option {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.image-drop {
  height: 70px;
  border-radius: 10px;
  border: 1px dashed rgba(128, 128, 128, 0.4);
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
</style>
