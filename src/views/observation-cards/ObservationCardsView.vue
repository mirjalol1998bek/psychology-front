<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/services/apiClient'
import { members } from '@/services/quizService'
import { OBSERVATION_BANDS } from '@/data/assessments/observationCard'

/**
 * Psixolog/admin: barcha kuzatuv kartalari (10-metodika, tyutorlar to'ldirgan).
 *   GET /api/observation_cards
 * Talaba ko'rmaydi, tyutor faqat o'zi to'ldirganlarini ko'radi (backend cheklaydi).
 */

interface ObservationCardRow {
  id: number
  student: { fullName: string | null; studyGroup: { name: string } | null }
  tutor: { fullName: string | null }
  totalScore: number
  riskLevel: string
  alertTriggered: boolean
  createdAt: string
}

const rows = ref<ObservationCardRow[]>([])
const loading = ref(true)

const RISK_COLOR: Record<string, string> = {
  none: 'success',
  attention: 'info',
  risk: 'warning',
  systemic: 'error',
}

function bandTitle(riskLevel: string): string {
  return OBSERVATION_BANDS.find((b) => b.key === riskLevel)?.title ?? riskLevel
}

async function load() {
  loading.value = true
  try {
    rows.value = members<ObservationCardRow>((await api.get('/observation_cards')).data)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-head mb-4">
      <h1 class="text-h4">Kuzatuv kartalari</h1>
      <p class="text-body-2 text-medium-emphasis mb-0" style="max-width: 62ch">
        10-metodika — tyutorlar o'z guruhi talabalari bo'yicha to'ldirgan ekspert bahosi.
      </p>
    </div>

    <v-card class="surface-card" rounded="lg">
      <div v-if="loading" class="pa-8 text-center">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <div v-else-if="!rows.length" class="pa-10 text-center text-medium-emphasis">
        <v-icon icon="mdi-clipboard-text-outline" size="40" class="mb-2 d-block mx-auto" />
        Hali birorta kuzatuv kartasi to'ldirilmagan.
      </div>

      <v-list v-else class="py-0" bg-color="transparent">
        <template v-for="(r, i) in rows" :key="r.id">
          <v-divider v-if="i > 0" />
          <v-list-item class="py-3">
            <div class="d-flex align-center flex-wrap" style="gap: 14px">
              <div class="flex-grow-1" style="min-width: 220px">
                <div class="text-body-1 font-weight-medium">
                  {{ r.student.fullName ?? '—' }}
                  <v-icon v-if="r.alertTriggered" icon="mdi-alert-circle" color="error" size="18" class="ml-1" />
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ r.student.studyGroup?.name ?? '—' }} · Tyutor: {{ r.tutor.fullName ?? '—' }}
                </div>
              </div>

              <v-chip :color="RISK_COLOR[r.riskLevel] ?? 'default'" variant="tonal">
                {{ r.totalScore }} ball — {{ bandTitle(r.riskLevel) }}
              </v-chip>
            </div>
          </v-list-item>
        </template>
      </v-list>
    </v-card>
  </div>
</template>
