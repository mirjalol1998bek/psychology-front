<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { INSTRUMENT_META } from '@/utils/instruments'
import type { InstrumentType } from '@/types/domain'

const auth = useAuthStore()
const router = useRouter()

// Staff: category hub — mirrors the real results-view.vue's gradient card
// picker, minus its dead-end for categories with no matching instrument.
const categoryCards: { instrument: InstrumentType; quizCount: number; gradient: string; description: string }[] = [
  { instrument: 'FREQUENCY_BASED', quizCount: 1, gradient: 'linear-gradient(135deg,#0075FF,#2CD9FF)', description: 'Ustuvor javoblar bo‘yicha temperament turini aniqlaydi' },
  { instrument: 'RANKING_BASED', quizCount: 1, gradient: 'linear-gradient(135deg,#7B2FF7,#F107A3)', description: 'Figuralarni afzallik tartibida saralash asosida' },
  { instrument: 'SCORE_RANGE_BASED', quizCount: 1, gradient: 'linear-gradient(135deg,#FF7A00,#FFC371)', description: 'Ball yig‘indisiga qarab erkin xulosa beradi' },
]

function openInstrument(instrument: InstrumentType) {
  router.push(`/results/${INSTRUMENT_META[instrument].routeSegment}`)
}

// Student: own results list (mock — wired to GET /student/result later).
const myResults = [
  { title: 'Temperament testi', label: 'Sangvinik', instrument: 'FREQUENCY_BASED' as InstrumentType, date: '02.09.2026' },
  { title: 'Psixogeometrik test', label: 'Doira', instrument: 'RANKING_BASED' as InstrumentType, date: '28.08.2026' },
  { title: 'Nevrasteniya so‘rovnomasi', label: '18 ball — past daraja', instrument: 'SCORE_RANGE_BASED' as InstrumentType, date: '20.08.2026' },
]
</script>

<template>
  <div v-if="auth.isStaff">
    <h1 class="text-display text-h4 font-weight-800 mb-1">Natijalar</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">Metodikani tanlang — fakultet/guruh kesimida natijalarni ko‘ring.</p>

    <v-row>
      <v-col v-for="c in categoryCards" :key="c.instrument" cols="12" sm="6" lg="4">
        <button class="category-card w-100 text-left" :style="{ background: c.gradient }" @click="openInstrument(c.instrument)">
          <v-icon :icon="INSTRUMENT_META[c.instrument].icon" color="white" size="30" class="mb-4" />
          <div class="text-h6 font-weight-800 text-white">{{ INSTRUMENT_META[c.instrument].label }}</div>
          <p class="text-body-2 mb-4" style="color: rgba(255,255,255,0.85)">{{ c.description }}</p>
          <span class="d-inline-flex align-center text-white font-weight-700 text-body-2">
            Natijalarni ko‘rish <v-icon icon="mdi-arrow-right" size="16" class="ml-1" />
          </span>
        </button>
      </v-col>
    </v-row>
  </div>

  <div v-else>
    <h1 class="text-display text-h4 font-weight-800 mb-1">Natijalar</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">Topshirilgan testlaringiz bo‘yicha xulosalar.</p>

    <v-card v-for="r in myResults" :key="r.title" class="surface-glass pa-4 mb-3 d-flex align-center" rounded="xl" style="gap: 16px">
      <div class="icon-badge" style="background: rgba(0,117,255,0.16)">
        <v-icon icon="mdi-file-chart-outline" color="primary" />
      </div>
      <div class="flex-grow-1">
        <div class="text-subtitle-1 font-weight-700">{{ r.title }}</div>
        <div class="text-caption text-medium-emphasis">{{ r.date }}</div>
      </div>
      <v-chip color="secondary" variant="tonal">{{ r.label }}</v-chip>
      <v-btn icon="mdi-download-outline" variant="text" color="primary" />
    </v-card>
  </div>
</template>

<style scoped>
.category-card {
  border: none;
  border-radius: 20px;
  padding: 26px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 10px 30px -14px rgba(0, 0, 0, 0.5);
}
.category-card:hover {
  transform: translateY(-3px);
}
</style>
