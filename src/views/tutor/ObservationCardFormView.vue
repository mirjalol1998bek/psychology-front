<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/services/apiClient'
import {
  OBSERVATION_INDICATORS,
  OBSERVATION_SCALE_LEGEND,
  OBSERVATION_ALERT_KEY,
  findObservationBand,
} from '@/data/assessments/observationCard'

/**
 * Tyutor: bitta talaba uchun 10-metodika (kuzatuv kartasi) — bir marta
 * to'ldiriladi. POST /api/observation_cards, hisoblash backend'da.
 */

interface TutorStudent {
  id: number
  fullName: string | null
  hasObservationCard: boolean
}

const route = useRoute()
const router = useRouter()
const studentId = Number(route.params.id)

const student = ref<TutorStudent | null>(null)
const loading = ref(true)
const scores = ref<Record<string, number | null>>(
  Object.fromEntries(OBSERVATION_INDICATORS.map((i) => [i.key, null])),
)
const submitting = ref(false)
const submitError = ref('')
const result = ref<{ totalScore: number; riskLevel: string } | null>(null)

const allAnswered = computed(() => OBSERVATION_INDICATORS.every((i) => scores.value[i.key] !== null))
const resultBand = computed(() => (result.value ? findObservationBand(result.value.totalScore) : null))

async function load() {
  loading.value = true
  try {
    const students = (await api.get<TutorStudent[]>('/tutor/students')).data
    student.value = students.find((s) => s.id === studentId) ?? null
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!allAnswered.value) return
  submitting.value = true
  submitError.value = ''
  try {
    const { data } = await api.post('/observation_cards', {
      student: `/api/users/${studentId}`,
      scores: scores.value,
    })
    result.value = { totalScore: data.totalScore, riskLevel: data.riskLevel }
  } catch (e: any) {
    submitError.value = e?.response?.data?.description ?? 'Saqlashda xatolik yuz berdi'
  } finally {
    submitting.value = false
  }
}

function backToList() {
  router.push({ name: 'tutor-students' })
}

onMounted(load)
</script>

<template>
  <div style="max-width: 900px">
    <div class="page-head mb-4">
      <v-btn variant="text" prepend-icon="mdi-arrow-left" size="small" class="mb-2" @click="backToList">
        Ro'yxatga qaytish
      </v-btn>
      <h1 class="text-h4">Kuzatuv kartasi</h1>
      <p v-if="student" class="text-body-2 text-medium-emphasis mb-0">
        {{ student.fullName }} — har bir ko'rsatkich bo'yicha so'nggi uch oydagi kuzatuvga asoslanib baho bering.
      </p>
    </div>

    <div v-if="loading" class="pa-8 text-center">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <v-alert v-else-if="!student" type="warning" variant="tonal">
      Bu talaba sizning guruhingizda topilmadi.
    </v-alert>

    <v-alert v-else-if="student.hasObservationCard && !result" type="info" variant="tonal">
      Bu talaba uchun kuzatuv kartasi allaqachon to'ldirilgan.
    </v-alert>

    <template v-else-if="result">
      <v-card class="surface-card pa-6" rounded="lg">
        <v-icon icon="mdi-check-circle-outline" size="40" color="success" class="mb-3" />
        <h2 class="text-h6 mb-1">Saqlandi — jami ball: {{ result.totalScore }}</h2>
        <p v-if="resultBand" class="text-body-1 font-weight-medium mb-1">{{ resultBand.title }}</p>
        <p v-if="resultBand" class="text-body-2 text-medium-emphasis mb-4">{{ resultBand.action }}</p>
        <v-btn color="primary" variant="flat" @click="backToList">Ro'yxatga qaytish</v-btn>
      </v-card>
    </template>

    <template v-else>
      <v-card class="surface-card pa-4 mb-4" rounded="lg">
        <div class="text-subtitle-2 mb-2">Baholash mezoni</div>
        <div class="d-flex flex-wrap" style="gap: 10px">
          <v-chip v-for="l in OBSERVATION_SCALE_LEGEND" :key="l.value" size="small" variant="tonal">
            {{ l.value }} — {{ l.label }}
          </v-chip>
        </div>
      </v-card>

      <v-card class="surface-card" rounded="lg">
        <v-list class="py-0" bg-color="transparent">
          <template v-for="(ind, i) in OBSERVATION_INDICATORS" :key="ind.key">
            <v-divider v-if="i > 0" />
            <v-list-item class="py-3">
              <div class="d-flex align-center flex-wrap" style="gap: 14px">
                <div class="flex-grow-1" style="min-width: 220px">
                  {{ i + 1 }}. {{ ind.label }}
                  <v-chip v-if="ind.key === OBSERVATION_ALERT_KEY" size="x-small" color="warning" variant="tonal" class="ml-2">
                    3 ball — darhol suhbat
                  </v-chip>
                </div>
                <v-btn-toggle v-model="scores[ind.key]" color="primary" density="comfortable" mandatory-off>
                  <v-btn v-for="n in [0, 1, 2, 3]" :key="n" :value="n" size="small">{{ n }}</v-btn>
                </v-btn-toggle>
              </div>
            </v-list-item>
          </template>
        </v-list>
      </v-card>

      <v-alert v-if="submitError" type="error" variant="tonal" class="mt-4">{{ submitError }}</v-alert>

      <div class="d-flex justify-end mt-4">
        <v-btn
          color="primary"
          variant="flat"
          size="large"
          :disabled="!allAnswered"
          :loading="submitting"
          @click="submit"
        >
          Saqlash
        </v-btn>
      </div>
    </template>
  </div>
</template>
