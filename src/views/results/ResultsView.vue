<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { INSTRUMENT_META, colorFor } from '@/utils/instruments'
import { getAttempts } from '@/services/attemptService'
import { MONTH_NAMES } from '@/composables/useMonthGrid'
import type { InstrumentType } from '@/types/domain'
import type { StoredAttempt } from '@/types/assessment'

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
function formatDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getDate()}-${MONTH_NAMES[d.getMonth()].toLowerCase()} ${d.getFullYear()}`
}

const categoryCards: { instrument: InstrumentType; quizCount: number; description: string; tint: string }[] = [
  { instrument: 'FREQUENCY_BASED', quizCount: 1, description: 'Ustuvor javoblar bo‘yicha temperament turini aniqlaydi', tint: colorFor('FREQUENCY_BASED', 'Sangvinik') },
  { instrument: 'RANKING_BASED', quizCount: 1, description: 'Figuralarni afzallik tartibida saralash asosida', tint: colorFor('RANKING_BASED', 'Doira') },
  { instrument: 'SCORE_RANGE_BASED', quizCount: 1, description: 'Ball yig‘indisiga qarab erkin xulosa beradi', tint: 'rgb(var(--v-theme-secondary))' },
]

function openInstrument(instrument: InstrumentType) {
  router.push(`/results/${INSTRUMENT_META[instrument].routeSegment}`)
}
</script>

<template>
  <div v-if="auth.isStaff">
    <header class="page-head">
      <h1 class="text-h4">Natijalar</h1>
      <p class="text-body-2 text-medium-emphasis mb-0">
        Metodikani tanlang — fakultet va guruh kesimida natijalarni ko‘ring.
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
          <div class="text-h6 text-display font-weight-bold mb-1">{{ INSTRUMENT_META[c.instrument].label }}</div>
          <p class="text-body-2 text-medium-emphasis mb-4">{{ c.description }}</p>
          <span class="d-inline-flex align-center text-primary font-weight-bold text-body-2">
            Natijalarni ko‘rish <v-icon icon="mdi-arrow-right" size="16" class="ml-1" />
          </span>
        </v-card>
      </v-col>
    </v-row>
  </div>

  <div v-else>
    <header class="page-head">
      <h1 class="text-h4">Natijalar</h1>
      <p class="text-body-2 text-medium-emphasis mb-0">Topshirilgan testlaringiz bo‘yicha xulosalar.</p>
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
        <div class="text-subtitle-1 font-weight-bold">{{ INSTRUMENT_META[r.instrumentType].label }}</div>
        <div class="text-caption text-medium-emphasis">{{ formatDate(r.submittedAt) }}</div>
      </div>
      <v-chip color="secondary" variant="tonal">{{ r.result?.label }}</v-chip>
      <v-icon icon="mdi-chevron-right" class="text-medium-emphasis" />
    </v-card>

    <v-empty-state
      v-if="!myAttempts.length"
      icon="mdi-chart-box-outline"
      title="Hali natija yo‘q"
      text="Test topshirganingizdan so‘ng xulosa shu yerda ko‘rinadi."
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
