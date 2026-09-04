<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import type { ResultSummaryDto } from '@/types/domain'

const { t } = useI18n()
const auth = useAuthStore()

const firstName = computed(() => auth.user?.hemis.fullName.split(' ')[0] ?? '')

// Placeholder data — replaced once /student/assignments and /student/result
// endpoints exist on the new backend (TZ §14, bosqich 2–3).
const stats = [
  { label: t('dashboard.assignedTests'), value: 4, icon: 'mdi-clipboard-text-outline', color: 'primary' },
  { label: t('dashboard.completed'), value: 2, icon: 'mdi-check-decagram-outline', color: 'success' },
]

const activitySpark = [3, 5, 4, 7, 6, 8, 6]

const upcomingAppointment = {
  date: '9-sentabr, seshanba',
  time: '10:00 – 10:30',
  psychologist: 'Nilufar Egamova',
}

const recentResults: (ResultSummaryDto & { title: string })[] = [
  {
    attemptId: 'a1',
    instrumentType: 'FREQUENCY_BASED',
    title: 'Temperament testi',
    label: 'Sangvinik',
    description: 'Ustuvor javoblar bo‘yicha aniqlangan',
  },
  {
    attemptId: 'a2',
    instrumentType: 'RANKING_BASED',
    title: 'Psixogeometrik test',
    label: 'Doira',
    description: '1-o‘rindagi figura asosida',
  },
  {
    attemptId: 'a3',
    instrumentType: 'SCORE_RANGE_BASED',
    title: 'Nevrasteniya so‘rovnomasi',
    label: '18 ball — past daraja',
    description: 'Ball oralig‘i xulosasi',
  },
]

const assignedTests = [
  { id: 't1', title: 'Temperament testi', deadline: '12-sentabr', questions: 20 },
  { id: 't2', title: 'Psixogeometrik test', deadline: '14-sentabr', questions: 5 },
  { id: 't3', title: 'Nevrasteniya so‘rovnomasi', deadline: '15-sentabr', questions: 24 },
]

function instrumentIcon(type: ResultSummaryDto['instrumentType']) {
  return {
    FREQUENCY_BASED: 'mdi-account-heart-outline',
    RANKING_BASED: 'mdi-shape-outline',
    SCORE_RANGE_BASED: 'mdi-gauge',
  }[type]
}
</script>

<template>
  <div>
    <h1 class="text-display text-h4 font-weight-600 mb-1">{{ t('dashboard.greeting') }}, {{ firstName }} 👋</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">{{ auth.user?.hemis.faculty }} · {{ auth.user?.hemis.group }}</p>

    <v-row>
      <v-col v-for="s in stats" :key="s.label" cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="1">
          <div class="d-flex align-center justify-space-between mb-2">
            <v-avatar :color="s.color" variant="tonal" rounded="lg" size="40">
              <v-icon :icon="s.icon" :color="s.color" />
            </v-avatar>
          </div>
          <div class="text-h4 font-weight-700">{{ s.value }}</div>
          <div class="text-caption text-medium-emphasis">{{ s.label }}</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="6">
        <v-card class="pa-4" elevation="1" height="100%">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption text-medium-emphasis text-uppercase">{{ t('dashboard.upcomingAppointment') }}</span>
            <v-icon icon="mdi-calendar-heart" color="secondary" />
          </div>
          <div class="text-subtitle-1 font-weight-600">{{ upcomingAppointment.date }}</div>
          <div class="text-body-2 text-medium-emphasis mb-3">
            {{ upcomingAppointment.time }} · {{ upcomingAppointment.psychologist }}
          </div>
          <v-btn variant="tonal" color="secondary" size="small" to="/calendar" class="text-none">
            {{ t('dashboard.bookAppointment') }}
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-1">
      <v-col cols="12" md="7">
        <v-card elevation="1">
          <v-card-item>
            <v-card-title class="text-subtitle-1 font-weight-600">{{ t('nav.tests') }}</v-card-title>
          </v-card-item>
          <v-divider />
          <v-list lines="two">
            <v-list-item v-for="test in assignedTests" :key="test.id">
              <template #prepend>
                <v-avatar color="primary" variant="tonal" rounded="lg">
                  <v-icon icon="mdi-file-document-edit-outline" color="primary" />
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-600">{{ test.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ test.questions }} savol · muddat: {{ test.deadline }}</v-list-item-subtitle>
              <template #append>
                <v-btn variant="text" color="primary" size="small" class="text-none">{{ t('dashboard.startTest') }}</v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card elevation="1" class="pa-4 mb-4">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-caption text-medium-emphasis text-uppercase">Faollik</span>
            <v-icon icon="mdi-trending-up" color="success" size="18" />
          </div>
          <v-sparkline
            :model-value="activitySpark"
            color="primary"
            :line-width="2"
            padding="8"
            smooth
            auto-draw
          />
        </v-card>

        <v-card elevation="1">
          <v-card-item>
            <v-card-title class="text-subtitle-1 font-weight-600">{{ t('dashboard.recentResults') }}</v-card-title>
          </v-card-item>
          <v-divider />
          <v-list>
            <v-list-item v-for="r in recentResults" :key="r.attemptId">
              <template #prepend>
                <v-avatar color="secondary" variant="tonal" rounded="lg">
                  <v-icon :icon="instrumentIcon(r.instrumentType)" color="secondary" />
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-600">{{ r.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ r.description }}</v-list-item-subtitle>
              <template #append>
                <v-chip color="secondary" variant="tonal" size="small">{{ r.label }}</v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
