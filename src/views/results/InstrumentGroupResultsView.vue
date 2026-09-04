<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InstrumentResult from '@/components/psixologiya/InstrumentResult.vue'
import { FACULTIES, GROUPS_BY_FACULTY, mockGroupResults } from '@/mocks/organization'
import { instrumentByRoute, INSTRUMENT_META, TEMPERAMENT_OPTIONS, SHAPE_OPTIONS } from '@/utils/instruments'

const route = useRoute()
const router = useRouter()

const instrument = computed(() => instrumentByRoute(route.params.instrument as string))
const meta = computed(() => INSTRUMENT_META[instrument.value])
const facultyId = route.params.facultyId as string
const groupId = route.params.groupId as string
const faculty = FACULTIES.find((f) => f.id === facultyId)
const group = (GROUPS_BY_FACULTY[facultyId] ?? []).find((g) => g.id === groupId)

const search = ref('')
const valueFilter = ref<string | null>(null)
const conclusionFilter = ref<'all' | 'has' | 'none'>('all')
const showFilters = ref(false)
const deleteTarget = ref<string | null>(null)

const filterOptions = computed(() => (instrument.value === 'FREQUENCY_BASED' ? TEMPERAMENT_OPTIONS : SHAPE_OPTIONS))

function valueOf(r: ReturnType<typeof mockGroupResults>[number]) {
  if (instrument.value === 'FREQUENCY_BASED') return r.temperament
  if (instrument.value === 'RANKING_BASED') return r.geometricFigure
  return r.conclusion
}

const rows = computed(() => {
  return mockGroupResults(groupId).filter((r) => {
    if (search.value && !r.student.fullName.toLowerCase().includes(search.value.toLowerCase())) return false
    const v = valueOf(r)
    if (instrument.value === 'SCORE_RANGE_BASED') {
      if (conclusionFilter.value === 'has' && !v) return false
      if (conclusionFilter.value === 'none' && v) return false
    } else if (valueFilter.value && v !== valueFilter.value) return false
    return true
  })
})

function exportExcel() {
  // TODO(backend): call the shared exportGroupResultsExcel() utility once
  // real rows exist (TZ §10) — same {facultyName, groupName, rows} shape
  // the old app's groupResultsExcelExport.js already uses.
  window.alert(`"${faculty?.name} – ${group?.name}.xlsx" yuklab olinadi (demo).`)
}

function confirmDelete(studentId: string) {
  deleteTarget.value = studentId
}
</script>

<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" class="text-none mb-2" @click="router.push(`/results/${meta.routeSegment}`)">
      Orqaga
    </v-btn>
    <div class="d-flex align-center justify-space-between flex-wrap mb-1" style="gap: 12px">
      <div>
        <h1 class="text-display text-h4 font-weight-800 mb-1">{{ group?.name }} — {{ meta.label }}</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">{{ faculty?.name }}</p>
      </div>
      <v-btn variant="tonal" color="success" prepend-icon="mdi-file-excel-outline" class="text-none" @click="exportExcel">
        Excelga yuklab olish
      </v-btn>
    </div>

    <v-card class="surface-glass pa-4 mt-4" rounded="xl">
      <div class="d-flex flex-wrap align-center mb-4" style="gap: 12px">
        <v-text-field
          v-model="search" density="compact" variant="solo" rounded="pill" hide-details flat
          prepend-inner-icon="mdi-magnify" placeholder="Talaba qidirish..." style="max-width: 260px" class="topbar-search"
        />
        <v-btn variant="tonal" color="secondary" prepend-icon="mdi-filter-variant" class="text-none" @click="showFilters = !showFilters">
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
              :items="[{ title: 'Barchasi', value: 'all' }, { title: 'Xulosa bor', value: 'has' }, { title: 'Xulosa yo‘q', value: 'none' }]"
              label="Xulosa holati" hide-details density="comfortable"
            />
          </v-col>
        </v-row>
      </v-expand-transition>

      <v-table>
        <thead>
          <tr>
            <th>T/R</th>
            <th>Talaba ID</th>
            <th>F.I.O</th>
            <th>{{ meta.label }}</th>
            <th class="text-right">Amallar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in rows" :key="r.student.id">
            <td>{{ i + 1 }}</td>
            <td class="text-medium-emphasis">{{ r.student.hemisId }}</td>
            <td class="d-flex align-center py-2" style="gap: 10px">
              <v-avatar size="30" color="primary" variant="tonal">
                <span class="text-caption font-weight-700">{{ r.student.fullName[0] }}</span>
              </v-avatar>
              {{ r.student.fullName }}
            </td>
            <td style="max-width: 320px"><InstrumentResult :instrument="instrument" :value="valueOf(r)" /></td>
            <td class="text-right">
              <v-btn v-if="valueOf(r)" icon="mdi-delete-outline" variant="text" size="small" color="error" @click="confirmDelete(r.student.id)" />
            </td>
          </tr>
        </tbody>
      </v-table>
      <v-empty-state v-if="!rows.length" icon="mdi-account-search-outline" title="Talaba topilmadi" density="compact" />
    </v-card>

    <v-dialog :model-value="!!deleteTarget" max-width="420" @update:model-value="deleteTarget = null">
      <v-card class="surface-glass pa-6" rounded="xl">
        <div class="d-flex align-center mb-3" style="gap: 10px">
          <v-icon icon="mdi-alert-circle-outline" color="error" size="26" />
          <span class="text-subtitle-1 font-weight-700">Natijani o‘chirish</span>
        </div>
        <p class="text-body-2 text-medium-emphasis mb-5">Bu amalni qaytarib bo‘lmaydi. Talabaning ushbu metodika bo‘yicha urinishi butunlay o‘chiriladi.</p>
        <div class="d-flex justify-end" style="gap: 10px">
          <v-btn variant="text" class="text-none" @click="deleteTarget = null">Bekor qilish</v-btn>
          <v-btn color="error" variant="flat" class="text-none" @click="deleteTarget = null">O‘chirish</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>
