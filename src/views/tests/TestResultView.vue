<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { instrumentByRoute, INSTRUMENT_META, colorFor, SHAPE_ICONS } from '@/utils/instruments'
import { getAttempt } from '@/services/attemptService'
import { MONTH_NAMES } from '@/composables/useMonthGrid'
import type { StoredAttempt } from '@/types/assessment'
import type { StudyLanguage } from '@/types/domain'

const MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const instrument = instrumentByRoute(route.params.id as string)
const meta = INSTRUMENT_META[instrument]
const language = (auth.user?.hemis.studyLanguage ?? 'uz') as StudyLanguage
const studentKey = auth.user?.hemis.hemisId ?? 'anon'

const attempt = ref<StoredAttempt | null>(null)
const loading = ref(true)

const t = (uz: string, ru: string) => (language === 'ru' ? ru : uz)

getAttempt(studentKey, instrument).then((a) => {
  attempt.value = a
  loading.value = false
  if (a?.status !== 'submitted') router.replace(`/tests/${meta.routeSegment}/take`)
})

const result = computed(() => attempt.value?.result ?? null)
const accent = computed(() => colorFor(instrument, result.value?.label))
const isRanking = instrument === 'RANKING_BASED'

// Score-scale (Zung) results come back as a single `{label:'score', value}`
// item — show it as one number, not a lone 100%-wide bar.
const scaleScore = computed(() => {
  const only = result.value?.breakdown
  if (only?.length === 1 && only[0].label === 'score') return only[0].value
  return null
})
const chartBreakdown = computed(() => (scaleScore.value === null ? (result.value?.breakdown ?? []) : []))
const maxBreakdown = computed(() => Math.max(1, ...chartBreakdown.value.map((b) => b.value)))

const submittedAt = computed(() => {
  if (!attempt.value?.submittedAt) return ''
  const d = new Date(attempt.value.submittedAt)
  const month = language === 'ru' ? MONTHS_RU[d.getMonth()] : MONTH_NAMES[d.getMonth()].toLowerCase()
  return `${d.getDate()}-${month} ${d.getFullYear()}`
})

</script>

<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-3" @click="router.push('/tests')">
      {{ t('Testlar', 'Тесты') }}
    </v-btn>

    <div v-if="loading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else-if="result">
      <v-card class="surface-card overflow-hidden mb-4" rounded="lg">
        <div class="result-hero" :style="{ '--accent': accent }">
          <div class="result-badge">
            <v-icon
              :icon="isRanking ? SHAPE_ICONS[result.label] ?? meta.icon : meta.icon"
              size="34"
              color="white"
            />
          </div>
          <div>
            <div class="text-caption text-uppercase" style="opacity: 0.8; letter-spacing: 0.08em">
              {{ meta.label }} · {{ submittedAt }}
            </div>
            <div class="text-h4 text-display font-weight-bold" style="color: #fff">{{ result.label }}</div>
            <div v-if="scaleScore !== null" class="text-body-2" style="color: #fff; opacity: 0.85">
              {{ t('Umumiy ball', 'Итоговый балл') }}: <strong>{{ scaleScore }}</strong>
            </div>
          </div>
        </div>

        <div class="pa-5 pa-md-6">
          <div class="text-subtitle-2 font-weight-bold text-uppercase text-medium-emphasis mb-2">
            {{ t('Natija tahlili', 'Анализ результата') }}
          </div>
          <p class="result-text">{{ result.description }}</p>
        </div>
      </v-card>

      <v-card v-if="chartBreakdown.length" class="surface-card pa-5" rounded="lg">
        <div class="text-subtitle-1 font-weight-bold mb-4">{{ t('Ballar taqsimoti', 'Распределение баллов') }}</div>
        <div v-for="b in chartBreakdown" :key="b.label" class="mb-3">
          <div class="d-flex justify-space-between text-body-2 mb-1">
            <span :class="{ 'font-weight-bold': b.label === result.label }">{{ b.label }}</span>
            <span class="text-medium-emphasis">{{ b.value }}</span>
          </div>
          <v-progress-linear
            :model-value="(b.value / maxBreakdown) * 100"
            height="8"
            rounded
            :color="b.label === result.label ? 'primary' : 'surface-variant'"
            bg-color="surface-variant"
          />
        </div>
      </v-card>

      <div class="d-flex flex-wrap mt-4" style="gap: 10px">
        <v-btn variant="tonal" color="primary" to="/results">{{ t('Barcha natijalar', 'Все результаты') }}</v-btn>
      </div>
      <p class="text-caption text-medium-emphasis mt-3">
        <v-icon icon="mdi-lock-outline" size="13" class="mr-1" />
        {{
          t(
            'Test bir marta topshiriladi. Qayta topshirish kerak bo‘lsa psixologga murojaat qiling.',
            'Тест проходится один раз. Если нужно пройти заново — обратитесь к психологу.',
          )
        }}
      </p>
    </template>
  </div>
</template>

<style scoped>
.result-hero {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 28px;
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, #000));
}
.result-badge {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.result-text {
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: 0.95rem;
}
.rank-row {
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.7));
}
.rank-row:last-child {
  border-bottom: none;
}
.rank-pos {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgb(var(--v-theme-surface-variant));
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
