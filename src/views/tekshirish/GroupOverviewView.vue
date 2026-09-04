<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InstrumentResult from '@/components/psixologiya/InstrumentResult.vue'
import { FACULTIES, GROUPS_BY_FACULTY, mockGroupResults } from '@/mocks/organization'
import { TEMPERAMENT_OPTIONS, SHAPE_OPTIONS } from '@/utils/instruments'

const route = useRoute()
const router = useRouter()

const facultyId = route.params.facultyId as string
const groupId = route.params.groupId as string

const faculty = FACULTIES.find((f) => f.id === facultyId)
const group = (GROUPS_BY_FACULTY[facultyId] ?? []).find((g) => g.id === groupId)

const search = ref('')
const temperamentFilter = ref<string | null>(null)
const shapeFilter = ref<string | null>(null)
const showFilters = ref(false)

const rows = computed(() => {
  return mockGroupResults(groupId).filter((r) => {
    if (search.value && !r.student.fullName.toLowerCase().includes(search.value.toLowerCase())) return false
    if (temperamentFilter.value && r.temperament !== temperamentFilter.value) return false
    if (shapeFilter.value && r.geometricFigure !== shapeFilter.value) return false
    return true
  })
})

function resetFilters() {
  temperamentFilter.value = null
  shapeFilter.value = null
  search.value = ''
}
</script>

<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" class="text-none mb-2" @click="router.push('/tekshirish')">
      Orqaga
    </v-btn>
    <h1 class="text-display text-h4 font-weight-800 mb-1">{{ group?.name }}</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">{{ faculty?.name }} · {{ group?.studentCount }} talaba</p>

    <v-card class="surface-glass pa-4" rounded="xl">
      <div class="d-flex flex-wrap align-center mb-4" style="gap: 12px">
        <v-text-field
          v-model="search"
          density="compact"
          variant="solo"
          rounded="pill"
          hide-details
          flat
          prepend-inner-icon="mdi-magnify"
          placeholder="Talaba qidirish..."
          style="max-width: 260px"
          class="topbar-search"
        />
        <v-btn variant="tonal" color="secondary" prepend-icon="mdi-filter-variant" class="text-none" @click="showFilters = !showFilters">
          Filter
        </v-btn>
        <v-btn v-if="temperamentFilter || shapeFilter || search" variant="text" size="small" class="text-none" @click="resetFilters">
          Tozalash
        </v-btn>
      </div>

      <v-expand-transition>
        <v-row v-if="showFilters" class="mb-2">
          <v-col cols="12" sm="6" md="4">
            <v-select v-model="temperamentFilter" :items="TEMPERAMENT_OPTIONS" label="Temperament" clearable hide-details density="comfortable" />
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-select v-model="shapeFilter" :items="SHAPE_OPTIONS" label="Psixogeometrik shakl" clearable hide-details density="comfortable" />
          </v-col>
        </v-row>
      </v-expand-transition>

      <v-table class="mt-2">
        <thead>
          <tr>
            <th>T/R</th>
            <th>Talaba ID</th>
            <th>F.I.O</th>
            <th>Temperament</th>
            <th>Psixogeometrik</th>
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
            <td><InstrumentResult instrument="FREQUENCY_BASED" :value="r.temperament" /></td>
            <td><InstrumentResult instrument="RANKING_BASED" :value="r.geometricFigure" /></td>
          </tr>
        </tbody>
      </v-table>
      <v-empty-state v-if="!rows.length" icon="mdi-account-search-outline" title="Talaba topilmadi" density="compact" />
    </v-card>
  </div>
</template>
