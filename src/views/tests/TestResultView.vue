<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { instrumentByRoute, INSTRUMENT_META, instrumentLabel, colorFor, SHAPE_ICONS } from '@/utils/instruments'
import { getAttempt } from '@/services/attemptService'
import { formatDay } from '@/utils/datetime'
import { SUBSCALE_ONLY, type StoredAttempt } from '@/types/assessment'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const instrument = instrumentByRoute(route.params.id as string)
const meta = INSTRUMENT_META[instrument]
const studentKey = auth.user?.hemis.hemisId ?? 'anon'

const attempt = ref<StoredAttempt | null>(null)
const loading = ref(true)

getAttempt(studentKey, instrument).then((a) => {
  attempt.value = a
  loading.value = false
  if (a?.status !== 'submitted') router.replace(`/tests/${meta.routeSegment}/take`)
})

const result = computed(() => attempt.value?.result ?? null)
const accent = computed(() => colorFor(instrument, result.value?.label))
const isRanking = instrument === 'RANKING_BASED'

// Score-scale (IPM-20 / OKM-20 / EHS-20) results carry the overall total in `result.score`.
const scaleScore = computed(() => result.value?.score ?? null)
// A subscaleless score-scale result's breakdown is a single redundant
// `{label:'score', value}` item (same number already shown above as
// scaleScore) — hide it. Subshkalali breakdown has one item per subshkala
// and is always shown.
const chartBreakdown = computed(() => {
  const b = result.value?.breakdown ?? []
  if (b.length === 1 && b[0].label === 'score') return []
  return b
})
const maxBreakdown = computed(() => Math.max(1, ...chartBreakdown.value.map((b) => b.value)))

// Some instruments (Sotsiometriya, and any future one shaped like it) give
// the student no individual result at all — no score, no breakdown, just a
// "we got it" acknowledgement. `resultKey === 'subscale_only'` (backend's
// ScoreScaleScorer::NO_OVERALL_RESULT_KEY) alone isn't enough to detect this
// — KSM-20/QY-16/Dembo-Rubinshteyn use the same key but DO have a breakdown
// to show. Nor is "empty breakdown" alone enough — Temperament/Psixogeometrik
// have a real categorical result with an empty breakdown too. Only the
// combination (that key AND nothing to show) means "no result at all",
// so any future instrument shaped the same way gets the same treatment
// automatically. Render a plain thank-you card instead of the usual hero +
// "NATIJA TAHLILI" analysis layout, which would otherwise imply an
// analysis that doesn't exist.
const isAcknowledgementOnly = computed(
  () => result.value?.resultKey === SUBSCALE_ONLY && chartBreakdown.value.length === 0 && scaleScore.value === null,
)

const submittedAt = computed(() => formatDay(attempt.value?.submittedAt, { year: true }))

</script>

<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-3" @click="router.push('/tests')">
      {{ t('nav.tests') }}
    </v-btn>

    <div v-if="loading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else-if="result">
      <v-card v-if="isAcknowledgementOnly" class="surface-card thank-you-card pa-8 pa-md-10 text-center" rounded="lg">
        <div class="thank-you-icon mb-4">
          <v-icon icon="mdi-check-circle" size="40" color="success" />
        </div>
        <div class="text-caption text-uppercase text-medium-emphasis mb-2" style="letter-spacing: 0.08em">
          {{ instrumentLabel(instrument) }} · {{ submittedAt }}
        </div>
        <div class="text-h5 text-display font-weight-bold mb-2">{{ result.label }}</div>
        <p class="text-body-1 text-medium-emphasis mb-0">{{ result.description }}</p>
      </v-card>

      <template v-else>
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
                {{ instrumentLabel(instrument) }} · {{ submittedAt }}
              </div>
              <div class="text-h4 text-display font-weight-bold" style="color: #fff">{{ result.label }}</div>
              <div v-if="scaleScore !== null" class="text-body-2" style="color: #fff; opacity: 0.85">
                {{ t('result.totalScore') }}: <strong>{{ scaleScore }}</strong>
              </div>
            </div>
          </div>

          <div class="pa-5 pa-md-6">
            <div class="text-subtitle-2 font-weight-bold text-uppercase text-medium-emphasis mb-2">
              {{ t('result.analysis') }}
            </div>
            <p class="result-text">{{ result.description }}</p>
          </div>
        </v-card>

        <v-card v-if="chartBreakdown.length" class="surface-card pa-5" rounded="lg">
          <div class="text-subtitle-1 font-weight-bold mb-4">{{ t('result.scoreDistribution') }}</div>
          <div v-for="b in chartBreakdown" :key="b.label" class="mb-3">
            <div class="d-flex justify-space-between text-body-2 mb-1">
              <span :class="{ 'font-weight-bold': b.label === result.label }">{{ b.label }}</span>
              <span class="text-medium-emphasis">{{ b.value }}{{ b.title ? ` · ${b.title}` : '' }}</span>
            </div>
            <v-progress-linear
              :model-value="(b.value / maxBreakdown) * 100"
              height="8"
              rounded
              :color="b.label === result.label ? 'primary' : 'surface-variant'"
              bg-color="surface-variant"
            />
            <p v-if="b.description" class="text-caption text-medium-emphasis mt-1 mb-0">{{ b.description }}</p>
          </div>
        </v-card>
      </template>

      <div class="d-flex flex-wrap mt-4" style="gap: 10px">
        <v-btn variant="tonal" color="primary" to="/results">{{ t('result.allResults') }}</v-btn>
      </div>
      <p class="text-caption text-medium-emphasis mt-3">
        <v-icon icon="mdi-lock-outline" size="13" class="mr-1" />
        {{ t('result.onceNote') }}
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
.thank-you-card {
  max-width: 480px;
  margin: 0 auto;
}
.thank-you-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(var(--v-theme-success), 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
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
