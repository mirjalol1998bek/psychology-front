<script setup lang="ts">
import { ref, computed } from 'vue'
import { INSTRUMENT_META } from '@/utils/instruments'
import { FACULTIES, GROUPS_BY_FACULTY } from '@/mocks/organization'
import type { InstrumentType } from '@/types/domain'

const categoryCards: { instrument: InstrumentType; quizCount: number; gradient: string }[] = [
  { instrument: 'FREQUENCY_BASED', quizCount: 1, gradient: 'linear-gradient(135deg,#0075FF,#2CD9FF)' },
  { instrument: 'RANKING_BASED', quizCount: 1, gradient: 'linear-gradient(135deg,#7B2FF7,#F107A3)' },
  { instrument: 'SCORE_RANGE_BASED', quizCount: 1, gradient: 'linear-gradient(135deg,#FF7A00,#FFC371)' },
]

const modalOpen = ref(false)
const activeInstrument = ref<InstrumentType | null>(null)
const selectedFaculties = ref<string[]>([])
const selectedGroups = ref<string[]>([])
const facultySearch = ref('')
const groupSearch = ref('')
const submitting = ref(false)
const toastOpen = ref(false)
const toast = ref<{ text: string; color: string }>({ text: '', color: 'success' })

function openFor(instrument: InstrumentType) {
  activeInstrument.value = instrument
  selectedFaculties.value = []
  selectedGroups.value = []
  modalOpen.value = true
}

const filteredFaculties = computed(() =>
  FACULTIES.filter((f) => f.name.toLowerCase().includes(facultySearch.value.toLowerCase())),
)
const availableGroups = computed(() =>
  selectedFaculties.value.flatMap((fid) => GROUPS_BY_FACULTY[fid] ?? []).filter((g) => g.name.toLowerCase().includes(groupSearch.value.toLowerCase())),
)

function toggleFaculty(id: string) {
  selectedFaculties.value = selectedFaculties.value.includes(id)
    ? selectedFaculties.value.filter((x) => x !== id)
    : [...selectedFaculties.value, id]
  // Deselect groups that belonged only to a now-unselected faculty.
  const validIds = new Set(availableGroups.value.map((g) => g.id))
  selectedGroups.value = selectedGroups.value.filter((g) => validIds.has(g))
}
function toggleGroup(id: string) {
  selectedGroups.value = selectedGroups.value.includes(id)
    ? selectedGroups.value.filter((x) => x !== id)
    : [...selectedGroups.value, id]
}

async function submit() {
  if (!selectedGroups.value.length) return
  submitting.value = true
  // TODO(backend): POST /admin/assignments once per selected group (TZ §14) —
  // the old app spaces these ~120ms apart with retry-on-lock, since the
  // API serializes writes per category.
  await new Promise((r) => setTimeout(r, 700))
  submitting.value = false
  toast.value = { text: `${selectedGroups.value.length} ta guruhga muvaffaqiyatli biriktirildi`, color: 'success' }
  toastOpen.value = true
  selectedGroups.value = []
  selectedFaculties.value = []
}
</script>

<template>
  <div>
    <h1 class="text-display text-h4 font-weight-800 mb-1">Test biriktirish</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">Metodikani tanlang, so‘ng fakultet va guruhlarni belgilab biriktiring.</p>

    <v-row>
      <v-col v-for="c in categoryCards" :key="c.instrument" cols="12" sm="6" lg="4">
        <button class="category-card w-100 text-left" :style="{ background: c.gradient }" @click="openFor(c.instrument)">
          <v-icon :icon="INSTRUMENT_META[c.instrument].icon" color="white" size="30" class="mb-4" />
          <div class="text-h6 font-weight-800 text-white mb-1">{{ INSTRUMENT_META[c.instrument].label }}</div>
          <v-chip size="small" variant="flat" color="white" class="mb-4" style="color: #111">{{ c.quizCount }} ta test</v-chip>
          <div>
            <span class="d-inline-flex align-center text-white font-weight-700 text-body-2">
              Biriktirish <v-icon icon="mdi-arrow-right" size="16" class="ml-1" />
            </span>
          </div>
        </button>
      </v-col>
    </v-row>

    <v-dialog v-model="modalOpen" max-width="820">
      <v-card class="surface-glass pa-6" rounded="xl">
        <div class="d-flex align-center justify-space-between mb-4">
          <span class="text-h6 font-weight-800">{{ activeInstrument ? INSTRUMENT_META[activeInstrument].label : '' }} — biriktirish</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="modalOpen = false" />
        </div>

        <v-row>
          <v-col cols="12" sm="6">
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-caption font-weight-700 text-medium-emphasis text-uppercase">Fakultetlar</span>
              <v-chip size="x-small" variant="tonal">{{ selectedFaculties.length }}</v-chip>
            </div>
            <v-text-field v-model="facultySearch" density="compact" variant="solo" rounded="pill" hide-details flat prepend-inner-icon="mdi-magnify" placeholder="Qidirish..." class="mb-2 topbar-search" />
            <v-card class="surface-glass pa-1" rounded="lg" style="max-height: 260px; overflow-y: auto">
              <v-checkbox
                v-for="f in filteredFaculties" :key="f.id" :model-value="selectedFaculties.includes(f.id)"
                :label="f.name" density="compact" hide-details class="px-2" @update:model-value="toggleFaculty(f.id)"
              />
            </v-card>
          </v-col>

          <v-col cols="12" sm="6">
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-caption font-weight-700 text-medium-emphasis text-uppercase">Guruhlar</span>
              <v-chip size="x-small" variant="tonal">{{ selectedGroups.length }}</v-chip>
            </div>
            <v-text-field v-model="groupSearch" density="compact" variant="solo" rounded="pill" hide-details flat prepend-inner-icon="mdi-magnify" placeholder="Qidirish..." class="mb-2 topbar-search" :disabled="!selectedFaculties.length" />
            <v-card class="surface-glass pa-1" rounded="lg" style="max-height: 260px; overflow-y: auto">
              <template v-if="selectedFaculties.length">
                <v-checkbox
                  v-for="g in availableGroups" :key="g.id" :model-value="selectedGroups.includes(g.id)"
                  :label="`${g.name} (${g.studentCount})`" density="compact" hide-details class="px-2" @update:model-value="toggleGroup(g.id)"
                />
              </template>
              <div v-else class="text-caption text-medium-emphasis pa-4 text-center">Avval fakultet tanlang</div>
            </v-card>
          </v-col>
        </v-row>

        <div class="d-flex justify-end mt-5" style="gap: 10px">
          <v-btn variant="text" class="text-none" @click="modalOpen = false">Bekor qilish</v-btn>
          <v-btn color="primary" variant="flat" class="text-none" :loading="submitting" :disabled="!selectedGroups.length" @click="submit">
            Biriktirish ({{ selectedGroups.length }})
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="toastOpen" location="top end" :color="toast.color" timeout="3000">
      {{ toast.text }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.category-card {
  border: none;
  border-radius: 20px;
  padding: 26px;
  cursor: pointer;
  transition: transform 0.15s ease;
  box-shadow: 0 10px 30px -14px rgba(0, 0, 0, 0.5);
}
.category-card:hover {
  transform: translateY(-3px);
}
</style>
