<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { INSTRUMENT_META } from '@/utils/instruments'
import type { InstrumentType, QuizDto } from '@/types/domain'

const auth = useAuthStore()

// Placeholder — wired to GET /admin/quizzes (staff) or GET /student/assignments
// (student) once the backend exists.
const quizzes: (QuizDto & { instrumentType: InstrumentType })[] = [
  { id: 't1', categoryId: 'c1', instrumentType: 'FREQUENCY_BASED', title: 'Temperament testi', description: 'Ustuvor javoblar bo‘yicha temperament turini aniqlaydi', timeLimitMinutes: 20, isActive: true, questionCount: 20 },
  { id: 't2', categoryId: 'c2', instrumentType: 'RANKING_BASED', title: 'Psixogeometrik test', description: 'Figuralarni afzallik tartibida saralash', timeLimitMinutes: 10, isActive: true, questionCount: 5 },
  { id: 't3', categoryId: 'c3', instrumentType: 'SCORE_RANGE_BASED', title: 'Nevrasteniya so‘rovnomasi', description: 'Ball yig‘indisi bo‘yicha xulosa beradi', timeLimitMinutes: 15, isActive: false, questionCount: 24 },
]

const categoryFilter = ref<InstrumentType | 'all'>('all')
const search = ref('')

const filtered = computed(() =>
  quizzes.filter((q) => {
    if (categoryFilter.value !== 'all' && q.instrumentType !== categoryFilter.value) return false
    if (search.value && !q.title.toLowerCase().includes(search.value.toLowerCase())) return false
    return true
  }),
)

const stats = computed(() => [
  { label: 'Jami testlar', value: quizzes.length, icon: 'mdi-clipboard-text-outline', color: '#0075FF' },
  { label: 'Faol testlar', value: quizzes.filter((q) => q.isActive).length, icon: 'mdi-check-decagram-outline', color: '#01B574' },
  { label: 'Kategoriyalar', value: new Set(quizzes.map((q) => q.categoryId)).size, icon: 'mdi-shape-outline', color: '#2CD9FF' },
  { label: 'Jami savollar', value: quizzes.reduce((s, q) => s + q.questionCount, 0), icon: 'mdi-help-circle-outline', color: '#FFB547' },
])

// Student-facing take/view state (mock).
const studentTests = [
  { id: 't1', title: 'Temperament testi', instrumentType: 'FREQUENCY_BASED' as InstrumentType, questions: 20, deadline: '12-sentabr', done: false },
  { id: 't2', title: 'Psixogeometrik test', instrumentType: 'RANKING_BASED' as InstrumentType, questions: 5, deadline: '14-sentabr', done: false },
  { id: 't3', title: 'Nevrasteniya so‘rovnomasi', instrumentType: 'SCORE_RANGE_BASED' as InstrumentType, questions: 24, deadline: '15-sentabr', done: true },
]
</script>

<template>
  <!-- Staff: test management -->
  <div v-if="auth.isStaff">
    <div class="d-flex align-center justify-space-between mb-1 flex-wrap" style="gap: 12px">
      <h1 class="text-display text-h4 font-weight-800 mb-0">Testlar</h1>
      <v-btn color="primary" class="text-none" prepend-icon="mdi-plus" to="/tests/create">Yangi test</v-btn>
    </div>

    <v-row class="mt-4">
      <v-col v-for="s in stats" :key="s.label" cols="12" sm="6" md="3">
        <v-card class="pa-4 surface-glass h-100" rounded="xl">
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-caption text-medium-emphasis">{{ s.label }}</span>
            <div class="icon-badge" :style="{ background: s.color }"><v-icon :icon="s.icon" color="white" size="20" /></div>
          </div>
          <div class="text-h4 font-weight-800">{{ s.value }}</div>
        </v-card>
      </v-col>
    </v-row>

    <div class="d-flex flex-wrap mt-5 mb-4" style="gap: 8px">
      <v-chip :variant="categoryFilter === 'all' ? 'flat' : 'tonal'" :color="categoryFilter === 'all' ? 'primary' : undefined" class="text-none" @click="categoryFilter = 'all'">Barchasi</v-chip>
      <v-chip
        v-for="[key, meta] in Object.entries(INSTRUMENT_META)" :key="key"
        :variant="categoryFilter === key ? 'flat' : 'tonal'" :color="categoryFilter === key ? 'primary' : undefined"
        class="text-none" @click="categoryFilter = key as InstrumentType"
      >
        {{ meta.label }}
      </v-chip>
      <v-spacer />
      <v-text-field v-model="search" density="compact" variant="solo" rounded="pill" hide-details flat prepend-inner-icon="mdi-magnify" placeholder="Test qidirish..." style="max-width: 220px" class="topbar-search" />
    </div>

    <v-card class="surface-glass" rounded="xl">
      <v-table>
        <thead>
          <tr>
            <th>Test nomi</th>
            <th>Kategoriya</th>
            <th>Savollar</th>
            <th>Davomiylik</th>
            <th>Holat</th>
            <th class="text-right">Amallar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="q in filtered" :key="q.id">
            <td class="py-3">
              <div class="font-weight-700">{{ q.title }}</div>
              <div class="text-caption text-medium-emphasis" style="max-width: 320px">{{ q.description }}</div>
            </td>
            <td><v-chip size="small" variant="tonal" color="secondary">{{ INSTRUMENT_META[q.instrumentType].label }}</v-chip></td>
            <td>{{ q.questionCount }}</td>
            <td>{{ q.timeLimitMinutes }} daqiqa</td>
            <td><v-chip size="small" variant="tonal" :color="q.isActive ? 'success' : undefined">{{ q.isActive ? 'Faol' : 'Nofaol' }}</v-chip></td>
            <td class="text-right">
              <v-btn :to="`/tests/${q.id}`" icon="mdi-pencil-outline" variant="text" size="small" color="primary" />
              <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" />
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>

  <!-- Student: take / view tests -->
  <div v-else>
    <h1 class="text-display text-h4 font-weight-800 mb-1">Testlar</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">Sizga tayinlangan psixologik metodikalar ro‘yxati.</p>

    <v-row>
      <v-col v-for="test in studentTests" :key="test.id" cols="12" sm="6" lg="4">
        <v-card class="pa-4 h-100 d-flex flex-column surface-glass" rounded="xl">
          <div class="d-flex align-start justify-space-between mb-3">
            <div class="icon-badge" style="background: rgba(0,117,255,0.16)">
              <v-icon :icon="INSTRUMENT_META[test.instrumentType].icon" color="primary" size="20" />
            </div>
            <v-chip v-if="test.done" color="success" variant="tonal" size="small" prepend-icon="mdi-check">Yakunlangan</v-chip>
            <v-chip v-else color="warning" variant="tonal" size="small">Kutilmoqda</v-chip>
          </div>

          <div class="text-subtitle-1 font-weight-700 mb-1">{{ test.title }}</div>
          <div class="text-caption text-medium-emphasis mb-4">{{ INSTRUMENT_META[test.instrumentType].label }}</div>

          <v-spacer />

          <div class="d-flex align-center justify-space-between mt-2">
            <span class="text-caption text-medium-emphasis"><v-icon icon="mdi-help-circle-outline" size="14" class="mr-1" />{{ test.questions }} savol</span>
            <span class="text-caption text-medium-emphasis"><v-icon icon="mdi-calendar-clock-outline" size="14" class="mr-1" />{{ test.deadline }}</span>
          </div>

          <v-btn :variant="test.done ? 'tonal' : 'flat'" color="primary" class="text-none mt-4" block :to="`/tests/${test.id}/take`">
            {{ test.done ? 'Natijani ko‘rish' : 'Boshlash' }}
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
