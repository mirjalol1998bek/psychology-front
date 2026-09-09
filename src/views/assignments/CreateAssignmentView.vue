<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { INSTRUMENT_META } from '@/utils/instruments'
import { useOrganizationStore } from '@/stores/organization'
import { api } from '@/services/apiClient'
import { loadCategoriesForInstrument } from '@/services/quizService'
import type { InstrumentType, StudyLanguage } from '@/types/domain'

/** HEMIS guruhning ta'lim tili — filtr va biriktiriladigan test tili shunga qarab. */
const LANG_LABEL: Record<StudyLanguage, string> = { uz: 'O‘zbek', ru: 'Rus' }

const org = useOrganizationStore()
org.load()

const categoryCards: { instrument: InstrumentType; quizCount: number }[] = [
  { instrument: 'FREQUENCY_BASED', quizCount: 1 },
  { instrument: 'RANKING_BASED', quizCount: 1 },
  { instrument: 'SCORE_RANGE_BASED', quizCount: 1 },
]

const modalOpen = ref(false)
const activeInstrument = ref<InstrumentType | null>(null)
const selectedFaculties = ref<string[]>([])
const selectedGroups = ref<string[]>([])
const facultySearch = ref('')
const groupSearch = ref('')
const langFilter = ref<'all' | StudyLanguage>('all')
const submitting = ref(false)
const toastOpen = ref(false)
const toast = ref<{ text: string; color: string }>({ text: '', color: 'success' })

function openFor(instrument: InstrumentType) {
  activeInstrument.value = instrument
  selectedFaculties.value = []
  selectedGroups.value = []
  langFilter.value = 'all'
  modalOpen.value = true
}

const filteredFaculties = computed(() =>
  org.faculties.filter((f) => f.name.toLowerCase().includes(facultySearch.value.toLowerCase())),
)
const availableGroups = computed(() =>
  selectedFaculties.value
    .flatMap((fid) => org.groupsByFaculty[fid] ?? [])
    .filter((g) => g.name.toLowerCase().includes(groupSearch.value.toLowerCase()))
    .filter((g) => langFilter.value === 'all' || g.studyLanguage === langFilter.value),
)

function toggleFaculty(id: string) {
  const nowSelected = !selectedFaculties.value.includes(id)
  selectedFaculties.value = nowSelected
    ? [...selectedFaculties.value, id]
    : selectedFaculties.value.filter((x) => x !== id)
  if (nowSelected) org.loadGroups(id)
  // Deselect groups that belonged only to a now-unselected faculty.
  const validIds = new Set(availableGroups.value.map((g) => g.id))
  selectedGroups.value = selectedGroups.value.filter((g) => validIds.has(g))
}
function toggleGroup(id: string) {
  selectedGroups.value = selectedGroups.value.includes(id)
    ? selectedGroups.value.filter((x) => x !== id)
    : [...selectedGroups.value, id]
}

// Til filtri o'zgarsa — ko'rinmay qolgan guruhlarni tanlangandan olib tashlaymiz.
watch(langFilter, () => {
  const visible = new Set(availableGroups.value.map((g) => g.id))
  selectedGroups.value = selectedGroups.value.filter((id) => visible.has(id))
})

async function submit() {
  if (!selectedGroups.value.length || !activeInstrument.value) return
  submitting.value = true
  let done = 0
  const skipped: string[] = []
  try {
    for (const groupId of selectedGroups.value) {
      const group = org.groupById(groupId)
      const lang = group?.studyLanguage ?? 'uz'
      const category = await loadCategoriesForInstrument(activeInstrument.value, lang)
      if (!category) {
        skipped.push(`${group?.name ?? groupId} (${LANG_LABEL[lang]})`)
        continue
      }
      await api.post('/assignments', {
        category: `/api/categories/${category.id}`,
        studyGroup: `/api/study_groups/${groupId}`,
        startAt: new Date().toISOString(),
      })
      done++
    }
    toast.value = skipped.length
      ? { text: `${done} ta guruhga biriktirildi. ${skipped.length} ta guruh uchun mos tilli test yo‘q: ${skipped.join(', ')}`, color: 'warning' }
      : { text: `${done} ta guruhga biriktirildi`, color: 'success' }
    modalOpen.value = false
  } catch {
    toast.value = { text: 'Xatolik — biriktirilmadi', color: 'error' }
  } finally {
    submitting.value = false
    toastOpen.value = true
    selectedGroups.value = []
    selectedFaculties.value = []
  }
}
</script>

<template>
  <div>
    <header class="page-head">
      <h1 class="text-h4">Test biriktirish</h1>
      <p class="text-body-2 text-medium-emphasis mb-0">
        Metodikani tanlang, so‘ng fakultet va guruhlarni belgilab biriktiring.
      </p>
    </header>

    <v-row>
      <v-col v-for="c in categoryCards" :key="c.instrument" cols="12" sm="6" lg="4">
        <v-card class="surface-card pa-5 h-100 picker-card" rounded="lg" @click="openFor(c.instrument)">
          <div class="icon-tile mb-4" style="--tint: rgb(var(--v-theme-primary)); width: 46px; height: 46px">
            <v-icon :icon="INSTRUMENT_META[c.instrument].icon" size="24" />
          </div>
          <div class="text-h6 text-display font-weight-bold mb-2">{{ INSTRUMENT_META[c.instrument].label }}</div>
          <v-chip size="small" variant="tonal" color="primary" class="mb-4">{{ c.quizCount }} ta test</v-chip>
          <div>
            <span class="d-inline-flex align-center text-primary font-weight-bold text-body-2">
              Biriktirish <v-icon icon="mdi-arrow-right" size="16" class="ml-1" />
            </span>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="modalOpen" max-width="820">
      <v-card class="surface-card pa-6" rounded="lg">
        <div class="d-flex align-center justify-space-between mb-4">
          <span class="text-h6 font-weight-bold">{{ activeInstrument ? INSTRUMENT_META[activeInstrument].label : '' }} — biriktirish</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="modalOpen = false" />
        </div>

        <v-row>
          <v-col cols="12" sm="6">
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-caption font-weight-bold text-medium-emphasis text-uppercase">Fakultetlar</span>
              <v-chip size="x-small" variant="tonal">{{ selectedFaculties.length }}</v-chip>
            </div>
            <v-text-field v-model="facultySearch" density="compact" variant="solo-filled" rounded="lg" hide-details flat bg-color="surface-variant" prepend-inner-icon="mdi-magnify" placeholder="Qidirish..." class="mb-2 app-search" />
            <v-card class="surface-sunken pa-1" rounded="lg" style="max-height: 260px; overflow-y: auto">
              <v-checkbox
                v-for="f in filteredFaculties" :key="f.id" :model-value="selectedFaculties.includes(f.id)"
                :label="f.name" density="compact" hide-details class="px-2" @update:model-value="toggleFaculty(f.id)"
              />
            </v-card>
          </v-col>

          <v-col cols="12" sm="6">
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-caption font-weight-bold text-medium-emphasis text-uppercase">Guruhlar</span>
              <v-chip size="x-small" variant="tonal">{{ selectedGroups.length }}</v-chip>
            </div>
            <v-chip-group v-model="langFilter" mandatory selected-class="text-primary" class="mb-1">
              <v-chip value="all" size="small" variant="tonal">Barchasi</v-chip>
              <v-chip value="uz" size="small" variant="tonal">O‘zbek</v-chip>
              <v-chip value="ru" size="small" variant="tonal">Rus</v-chip>
            </v-chip-group>
            <v-text-field v-model="groupSearch" density="compact" variant="solo-filled" rounded="lg" hide-details flat bg-color="surface-variant" prepend-inner-icon="mdi-magnify" placeholder="Qidirish..." class="mb-2 app-search" :disabled="!selectedFaculties.length" />
            <v-card class="surface-sunken pa-1" rounded="lg" style="max-height: 232px; overflow-y: auto">
              <template v-if="selectedFaculties.length">
                <v-checkbox
                  v-for="g in availableGroups" :key="g.id" :model-value="selectedGroups.includes(g.id)"
                  density="compact" hide-details class="px-2" @update:model-value="toggleGroup(g.id)"
                >
                  <template #label>
                    <span>{{ g.name }} <span class="text-medium-emphasis">({{ g.studentCount }})</span></span>
                    <v-chip size="x-small" variant="tonal" :color="g.studyLanguage === 'ru' ? 'info' : 'primary'" class="ml-2">
                      {{ LANG_LABEL[g.studyLanguage] }}
                    </v-chip>
                  </template>
                </v-checkbox>
                <div v-if="!availableGroups.length" class="text-caption text-medium-emphasis pa-4 text-center">
                  Bu til bo‘yicha guruh yo‘q
                </div>
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
.picker-card {
  cursor: pointer;
  transition: border-color 0.15s var(--ease), transform 0.15s var(--ease), box-shadow 0.15s var(--ease);
}
.picker-card:hover {
  transform: translateY(-2px);
  border-color: rgb(var(--v-theme-primary));
  box-shadow: var(--shadow-md);
}
</style>
