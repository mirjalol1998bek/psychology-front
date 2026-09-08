<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InstrumentResult from '@/components/psixologiya/InstrumentResult.vue'
import { useOrganizationStore } from '@/stores/organization'
import { instrumentByRoute, INSTRUMENT_META, TEMPERAMENT_OPTIONS, SHAPE_OPTIONS } from '@/utils/instruments'
import { downloadCsv, fileSlug } from '@/utils/exportTable'
import { api } from '@/services/apiClient'
import { loadCategoriesForInstrument } from '@/services/quizService'

interface Row {
  studentId: number
  hemisId: string | null
  fullName: string
  resultKey: string
  label: string
  score: number | null
}

const route = useRoute()
const router = useRouter()
const org = useOrganizationStore()
org.load()

const instrument = computed(() => instrumentByRoute(route.params.instrument as string))
const meta = computed(() => INSTRUMENT_META[instrument.value])
const facultyId = route.params.facultyId as string
const groupId = route.params.groupId as string
const faculty = computed(() => org.facultyById(facultyId))
const group = computed(() => org.groupById(groupId))

const search = ref('')
const valueFilter = ref<string | null>(null)
const conclusionFilter = ref<'all' | 'has' | 'none'>('all')
const showFilters = ref(false)
const loading = ref(true)
const allRows = ref<Row[]>([])

const filterOptions = computed(() => (instrument.value === 'FREQUENCY_BASED' ? TEMPERAMENT_OPTIONS : SHAPE_OPTIONS))

function valueOf(r: Row): string | null {
  if (instrument.value === 'SCORE_RANGE_BASED') return r.label || null
  return r.resultKey || null
}

async function fetchRows() {
  loading.value = true
  try {
    await org.load()
    const lang = group.value?.studyLanguage ?? 'uz'
    const category = await loadCategoriesForInstrument(instrument.value, lang)
    if (!category) {
      allRows.value = []
      return
    }
    const { data } = await api.get('/admin/group_results', {
      params: { studyGroup: groupId, category: category.id },
    })
    allRows.value = (data as Row[]) ?? []
  } catch {
    allRows.value = []
  } finally {
    loading.value = false
  }
}
fetchRows()
watch(instrument, fetchRows)

const rows = computed(() =>
  allRows.value.filter((r) => {
    if (search.value && !r.fullName.toLowerCase().includes(search.value.toLowerCase())) return false
    const v = valueOf(r)
    if (instrument.value === 'SCORE_RANGE_BASED') {
      if (conclusionFilter.value === 'has' && !v) return false
      if (conclusionFilter.value === 'none' && v) return false
    } else if (valueFilter.value && v !== valueFilter.value) return false
    return true
  }),
)

function exportCsv() {
  const headers = ['T/R', 'Talaba ID', 'F.I.O', meta.value.label]
  const data = rows.value.map((r, i) => [i + 1, r.hemisId ?? '', r.fullName, valueOf(r) ?? 'Aniqlanmagan'])
  const name = `${fileSlug(faculty.value?.name ?? '')}_${fileSlug(group.value?.name ?? 'guruh')}_${meta.value.routeSegment}`
  downloadCsv(name, headers, data)
}
</script>

<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-3" @click="router.push(`/results/${meta.routeSegment}`)">
      Orqaga
    </v-btn>
    <div class="d-flex align-end justify-space-between page-head flex-wrap" style="gap: 12px">
      <div>
        <h1 class="text-h4">{{ group?.name }} — {{ meta.label }}</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">{{ faculty?.name }}</p>
      </div>
      <v-btn
        variant="tonal"
        color="success"
        prepend-icon="mdi-file-download-outline"
        :disabled="!rows.length"
        @click="exportCsv"
      >
        Jadvalni yuklab olish
      </v-btn>
    </div>

    <v-card class="surface-card pa-4" rounded="lg">
      <div class="d-flex flex-wrap align-center mb-4" style="gap: 12px">
        <v-text-field
          v-model="search"
          density="compact"
          variant="solo-filled"
          rounded="lg"
          hide-details
          flat
          bg-color="surface-variant"
          prepend-inner-icon="mdi-magnify"
          placeholder="Talaba qidirish..."
          style="max-width: 260px"
          class="app-search"
        />
        <v-btn variant="tonal" color="secondary" prepend-icon="mdi-filter-variant" @click="showFilters = !showFilters">
          Filter
        </v-btn>
      </div>

      <v-expand-transition>
        <v-row v-if="showFilters" class="mb-2">
          <v-col v-if="instrument !== 'SCORE_RANGE_BASED'" cols="12" sm="6" md="4">
            <v-select v-model="valueFilter" :items="filterOptions" :label="meta.label" clearable hide-details density="comfortable" />
          </v-col>
          <v-col v-else cols="12" sm="6" md="4">
            <v-select
              v-model="conclusionFilter"
              :items="[
                { title: 'Barchasi', value: 'all' },
                { title: 'Xulosa bor', value: 'has' },
                { title: 'Xulosa yo‘q', value: 'none' },
              ]"
              label="Xulosa holati"
              hide-details
              density="comfortable"
            />
          </v-col>
        </v-row>
      </v-expand-transition>

      <div v-if="loading" class="d-flex justify-center py-10">
        <v-progress-circular indeterminate color="primary" />
      </div>
      <v-table v-else>
        <thead>
          <tr>
            <th>T/R</th>
            <th>Talaba ID</th>
            <th>F.I.O</th>
            <th>{{ meta.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in rows" :key="r.studentId">
            <td>{{ i + 1 }}</td>
            <td class="text-medium-emphasis">{{ r.hemisId }}</td>
            <td>
              <div class="d-flex align-center py-2" style="gap: 10px">
                <v-avatar size="30" color="primary" variant="tonal">
                  <span class="text-caption font-weight-bold">{{ r.fullName[0] }}</span>
                </v-avatar>
                {{ r.fullName }}
              </div>
            </td>
            <td style="max-width: 320px"><InstrumentResult :instrument="instrument" :value="valueOf(r)" /></td>
          </tr>
        </tbody>
      </v-table>
      <v-empty-state v-if="!loading && !rows.length" icon="mdi-account-search-outline" title="Talaba topilmadi" density="compact" />
    </v-card>
  </div>
</template>
