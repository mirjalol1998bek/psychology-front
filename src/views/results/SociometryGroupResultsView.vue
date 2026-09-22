<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrganizationStore } from '@/stores/organization'
import { api } from '@/services/apiClient'
import { SOCIOMETRY_CATEGORIES, cohesionLevel } from '@/data/assessments/sociometry'

/**
 * Sotsiometriya — guruh darajasidagi tahlil (faqat psixolog/admin).
 * Boshqa metodikalardan farqli: individual resultKey emas, juftlik
 * (kim kimni tanladi) asosidagi guruh ko'rsatkichlari — shu sabab umumiy
 * `InstrumentGroupResultsView.vue`dan alohida, o'ziga xos komponent
 * (`observation-card.md`dagi kabi mulohaza: reuse emas, chunki data shakli
 * tubdan boshqa).
 */

interface SociometryRow {
  studentId: number
  fullName: string
  submitted: boolean
  received: number
  given: number
  statusIndex: number
  expansivenessIndex: number
  category: string
}
interface SociometryReport {
  totalStudents: number
  submittedCount: number
  participationRate: number
  cohesion: number
  isolationRate: number
  rows: SociometryRow[]
}

const route = useRoute()
const router = useRouter()
const org = useOrganizationStore()

const facultyId = route.params.facultyId as string
const groupId = route.params.groupId as string
const faculty = computed(() => org.facultyById(facultyId))
const group = computed(() => org.groupById(groupId))
org.load().then(() => org.loadGroups(facultyId))

const loading = ref(true)
const report = ref<SociometryReport | null>(null)

async function load() {
  loading.value = true
  try {
    report.value = (await api.get<SociometryReport>('/admin/sociometry', { params: { studyGroup: groupId } })).data
  } catch {
    report.value = null
  } finally {
    loading.value = false
  }
}
load()

const cohesion = computed(() => (report.value ? cohesionLevel(report.value.cohesion) : null))
const rowsSorted = computed(() => [...(report.value?.rows ?? [])].sort((a, b) => b.received - a.received))
</script>

<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-3" @click="router.push('/results/sotsiometriya')">
      Orqaga
    </v-btn>
    <header class="page-head">
      <h1 class="text-h4">{{ group?.name }} — Sotsiometriya</h1>
      <p class="text-body-2 text-medium-emphasis mb-0">{{ faculty?.name }}</p>
    </header>

    <div v-if="loading" class="d-flex justify-center py-10">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else-if="report">
      <v-alert
        v-if="report.participationRate < 85"
        type="warning"
        variant="tonal"
        class="mb-4"
      >
        Ishtirok darajasi {{ report.participationRate }}% — rasmiy talab (kamida 85%) bajarilmagan, natijalar ehtiyotkorlik bilan talqin qilinsin.
      </v-alert>

      <v-row class="mb-2">
        <v-col cols="12" sm="4">
          <v-card class="surface-card pa-4" rounded="lg">
            <div class="text-caption text-medium-emphasis mb-1">Ishtirok</div>
            <div class="text-h5 font-weight-bold">{{ report.submittedCount }}/{{ report.totalStudents }}</div>
            <div class="text-caption text-medium-emphasis">{{ report.participationRate }}%</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card class="surface-card pa-4" rounded="lg">
            <div class="text-caption text-medium-emphasis mb-1">Guruh jipsligi (Cn)</div>
            <div class="text-h5 font-weight-bold">{{ report.cohesion }}</div>
            <div class="text-caption text-medium-emphasis">{{ cohesion?.label }} — {{ cohesion?.description }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card class="surface-card pa-4" rounded="lg">
            <div class="text-caption text-medium-emphasis mb-1">Izolyatsiya (Kiz)</div>
            <div class="text-h5 font-weight-bold">{{ report.isolationRate }}%</div>
            <div class="text-caption text-medium-emphasis">Hech kim tanlamagan talabalar ulushi</div>
          </v-card>
        </v-col>
      </v-row>

      <v-card class="surface-card pa-4" rounded="lg">
        <v-table>
          <thead>
            <tr>
              <th>F.I.SH</th>
              <th class="text-center">Olingan tanlov (M)</th>
              <th class="text-center">Bergan tanlov (R)</th>
              <th class="text-center">Si</th>
              <th>Kategoriya</th>
              <th class="text-center">Topshirdimi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rowsSorted" :key="r.studentId">
              <td>
                <div class="d-flex align-center py-2" style="gap: 10px">
                  <v-avatar size="30" color="primary" variant="tonal">
                    <span class="text-caption font-weight-bold">{{ r.fullName[0] }}</span>
                  </v-avatar>
                  {{ r.fullName }}
                </div>
              </td>
              <td class="text-center">{{ r.received }}</td>
              <td class="text-center">{{ r.given }}</td>
              <td class="text-center">{{ r.statusIndex }}</td>
              <td>
                <v-chip
                  size="small"
                  :color="SOCIOMETRY_CATEGORIES[r.category]?.color"
                  :prepend-icon="SOCIOMETRY_CATEGORIES[r.category]?.icon"
                  variant="tonal"
                >
                  {{ SOCIOMETRY_CATEGORIES[r.category]?.label ?? r.category }}
                </v-chip>
              </td>
              <td class="text-center">
                <v-icon v-if="r.submitted" icon="mdi-check" color="success" size="18" />
                <v-icon v-else icon="mdi-minus" color="disabled" size="18" />
              </td>
            </tr>
          </tbody>
        </v-table>
        <v-empty-state v-if="!rowsSorted.length" icon="mdi-account-search-outline" title="Talaba topilmadi" density="compact" />
      </v-card>
    </template>
  </div>
</template>
