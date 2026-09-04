<script setup lang="ts">
import type { InstrumentType } from '@/types/domain'

// Placeholder — wired to GET /student/assignments once the new backend exists.
const tests: {
  id: string
  title: string
  instrumentType: InstrumentType
  questions: number
  deadline: string
  done: boolean
}[] = [
  { id: 't1', title: 'Temperament testi', instrumentType: 'FREQUENCY_BASED', questions: 20, deadline: '12-sentabr', done: false },
  { id: 't2', title: 'Psixogeometrik test', instrumentType: 'RANKING_BASED', questions: 5, deadline: '14-sentabr', done: false },
  { id: 't3', title: 'Nevrasteniya so‘rovnomasi', instrumentType: 'SCORE_RANGE_BASED', questions: 24, deadline: '15-sentabr', done: true },
]

const meta: Record<InstrumentType, { icon: string; color: string; label: string }> = {
  FREQUENCY_BASED: { icon: 'mdi-account-heart-outline', color: 'primary', label: 'Chastota asosida' },
  RANKING_BASED: { icon: 'mdi-shape-outline', color: 'secondary', label: 'Saralash asosida' },
  SCORE_RANGE_BASED: { icon: 'mdi-gauge', color: 'info', label: 'Ball oralig‘i asosida' },
}
</script>

<template>
  <div>
    <h1 class="text-display text-h4 font-weight-600 mb-1">Testlar</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">Sizga tayinlangan psixologik metodikalar ro‘yxati.</p>

    <v-row>
      <v-col v-for="test in tests" :key="test.id" cols="12" sm="6" lg="4">
        <v-card elevation="1" class="pa-4 h-100 d-flex flex-column">
          <div class="d-flex align-start justify-space-between mb-3">
            <v-avatar :color="meta[test.instrumentType].color" variant="tonal" rounded="lg" size="44">
              <v-icon :icon="meta[test.instrumentType].icon" :color="meta[test.instrumentType].color" size="22" />
            </v-avatar>
            <v-chip v-if="test.done" color="success" variant="tonal" size="small" prepend-icon="mdi-check">
              Yakunlangan
            </v-chip>
            <v-chip v-else color="warning" variant="tonal" size="small">Kutilmoqda</v-chip>
          </div>

          <div class="text-subtitle-1 font-weight-600 mb-1">{{ test.title }}</div>
          <div class="text-caption text-medium-emphasis mb-4">{{ meta[test.instrumentType].label }}</div>

          <v-spacer />

          <div class="d-flex align-center justify-space-between mt-2">
            <span class="text-caption text-medium-emphasis">
              <v-icon icon="mdi-help-circle-outline" size="14" class="mr-1" />{{ test.questions }} savol
            </span>
            <span class="text-caption text-medium-emphasis">
              <v-icon icon="mdi-calendar-clock-outline" size="14" class="mr-1" />{{ test.deadline }}
            </span>
          </div>

          <v-btn
            :variant="test.done ? 'tonal' : 'flat'"
            :color="test.done ? 'primary' : 'primary'"
            class="text-none mt-4"
            block
            :to="`/tests/${test.id}`"
          >
            {{ test.done ? 'Natijani ko‘rish' : 'Boshlash' }}
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
