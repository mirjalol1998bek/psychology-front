<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { INSTRUMENT_META, instrumentLabel, colorFor } from '@/utils/instruments'
import { getAttempts } from '@/services/attemptService'
import { formatDay } from '@/utils/datetime'
import type { InstrumentType } from '@/types/domain'
import type { StoredAttempt } from '@/types/assessment'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()

const myAttempts = ref<StoredAttempt[]>([])
if (!auth.isStaff) {
  getAttempts(auth.user?.hemis.hemisId ?? 'anon').then((a) => {
    myAttempts.value = a
      .filter((x) => x.status === 'submitted')
      .sort((x, y) => (y.submittedAt ?? '').localeCompare(x.submittedAt ?? ''))
  })
}
const formatDate = (iso?: string) => formatDay(iso, { year: true })

const categoryCards: { instrument: InstrumentType; tint: string }[] = [
  { instrument: 'FREQUENCY_BASED', tint: colorFor('FREQUENCY_BASED', 'Sangvinik') },
  { instrument: 'RANKING_BASED', tint: colorFor('RANKING_BASED', 'Doira') },
  { instrument: 'SCORE_RANGE_BASED', tint: 'rgb(var(--v-theme-secondary))' },
  { instrument: 'SUBSCALE_BASED', tint: 'rgb(var(--v-theme-warning))' },
]

function openInstrument(instrument: InstrumentType) {
  router.push(`/results/${INSTRUMENT_META[instrument].routeSegment}`)
}
</script>

<template>
  <div v-if="auth.isStaff">
    <header class="page-head">
      <h1 class="text-h4">{{ t('nav.results') }}</h1>
      <p class="text-body-2 text-medium-emphasis mb-0">
        {{ t('results.staffSubtitle') }}
      </p>
    </header>

    <v-row>
      <v-col v-for="c in categoryCards" :key="c.instrument" cols="12" sm="6" lg="4">
        <v-card
          class="surface-card pa-5 h-100 picker-card"
          rounded="lg"
          @click="openInstrument(c.instrument)"
        >
          <div class="icon-tile mb-4" :style="{ '--tint': c.tint, width: '46px', height: '46px' }">
            <v-icon :icon="INSTRUMENT_META[c.instrument].icon" size="24" />
          </div>
          <div class="text-h6 text-display font-weight-bold mb-1">{{ instrumentLabel(c.instrument) }}</div>
          <p class="text-body-2 text-medium-emphasis mb-4">{{ t(`results.cardDesc.${c.instrument}`) }}</p>
          <span class="d-inline-flex align-center text-primary font-weight-bold text-body-2">
            {{ t('results.viewResults') }} <v-icon icon="mdi-arrow-right" size="16" class="ml-1" />
          </span>
        </v-card>
      </v-col>
    </v-row>
  </div>

  <div v-else>
    <header class="page-head">
      <h1 class="text-h4">{{ t('nav.results') }}</h1>
      <p class="text-body-2 text-medium-emphasis mb-0">{{ t('result.studentSubtitle') }}</p>
    </header>

    <v-card
      v-for="r in myAttempts"
      :key="r.instrumentType"
      class="surface-card pa-4 mb-3 d-flex align-center result-link"
      rounded="lg"
      style="gap: 16px"
      @click="router.push(`/tests/${INSTRUMENT_META[r.instrumentType].routeSegment}/result`)"
    >
      <div class="icon-tile" :style="{ '--tint': colorFor(r.instrumentType, r.result?.label) }">
        <v-icon :icon="INSTRUMENT_META[r.instrumentType].icon" />
      </div>
      <div class="flex-grow-1">
        <div class="text-subtitle-1 font-weight-bold">{{ instrumentLabel(r.instrumentType) }}</div>
        <div class="text-caption text-medium-emphasis">{{ formatDate(r.submittedAt) }}</div>
      </div>
      <v-chip color="secondary" variant="tonal">{{ r.result?.label }}</v-chip>
      <v-icon icon="mdi-chevron-right" class="text-medium-emphasis" />
    </v-card>

    <v-empty-state
      v-if="!myAttempts.length"
      icon="mdi-chart-box-outline"
      :title="t('result.emptyTitle')"
      :text="t('result.emptyText')"
      class="mt-4"
    />
  </div>
</template>

<style scoped>
.picker-card {
  cursor: pointer;
  transition: border-color 0.15s var(--ease), transform 0.15s var(--ease), box-shadow 0.15s var(--ease);
}
.picker-card:hover {
  transform: translateY(-2px);
  border-color: rgb(var(--v-theme-primary));
  box-shadow: var(--shadow-md);
}
.result-link {
  cursor: pointer;
  transition: border-color 0.12s var(--ease);
}
.result-link:hover {
  border-color: rgb(var(--v-theme-primary));
}
</style>
