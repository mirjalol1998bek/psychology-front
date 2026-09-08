<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MiniCalendar from '@/components/dashboard/MiniCalendar.vue'
import { CAL_STATUS_META, TODAY, type CalEvent } from '@/mocks/calendar'
import { useCalendarStore } from '@/stores/calendar'
import { MONTH_NAMES } from '@/composables/useMonthGrid'
import { INSTRUMENT_META } from '@/utils/instruments'
import { listInstruments } from '@/services/quizService'
import { getAttempts } from '@/services/attemptService'
import { useAppealsStore } from '@/stores/appeals'
import { usePassportStore, completeness } from '@/stores/passport'
import type { InstrumentType, StudyLanguage } from '@/types/domain'
import type { StoredAttempt } from '@/types/assessment'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()
const calendarStore = useCalendarStore()
const appealsStore = useAppealsStore()
const passportStore = usePassportStore()

appealsStore.load()
calendarStore.load()
if (!auth.isStaff) passportStore.load()

const passportPct = computed(() => completeness(passportStore.get(auth.user?.hemis.hemisId ?? 'anon')))

// Student's real quiz catalogue + attempts.
const instruments = ref<Awaited<ReturnType<typeof listInstruments>>>([])
const attempts = ref<StoredAttempt[]>([])
if (!auth.isStaff) {
  const lang = (auth.user?.hemis.studyLanguage ?? 'uz') as StudyLanguage
  Promise.all([listInstruments(lang), getAttempts(auth.user?.hemis.hemisId ?? 'anon')]).then(([qs, at]) => {
    instruments.value = qs
    attempts.value = at
  })
}
const attemptFor = (i: InstrumentType) => attempts.value.find((a) => a.instrumentType === i)
const availableInstruments = computed(() => instruments.value.filter((q) => q.available))
const submittedAttempts = computed(() => attempts.value.filter((a) => a.status === 'submitted'))
const nextTest = computed(() =>
  availableInstruments.value.find((q) => attemptFor(q.instrumentType)?.status !== 'submitted'),
)

const firstName = computed(() => auth.user?.hemis.fullName.split(' ')[0] ?? '')
const subline = computed(() =>
  auth.isStaff ? auth.user?.hemis.faculty : `${auth.user?.hemis.faculty} · ${auth.user?.hemis.group}`,
)

// Placeholder data — replaced once /student/assignments, /student/result and
// /admin/result/fakulty exist on the new backend.
const statTiles = computed(() =>
  auth.isStaff
    ? [
        { label: 'Tayinlangan testlar', value: '18', hint: '3 ta bu hafta', icon: 'mdi-clipboard-text-outline', tint: 'rgb(var(--v-theme-primary))' },
        { label: 'Faol murojaatlar', value: String(appealsStore.openCount), hint: 'Javob kutmoqda', icon: 'mdi-message-text-outline', tint: 'rgb(var(--v-theme-error))', to: '/appeals' },
        { label: 'Bugungi qabullar', value: '6', hint: 'Keyingisi 11:00 da', icon: 'mdi-calendar-heart', tint: 'rgb(var(--v-theme-secondary))' },
        { label: 'O‘rtacha qamrov', value: '78%', hint: '+5% oldingi oyga nisbatan', icon: 'mdi-chart-arc', tint: 'rgb(var(--v-theme-success))' },
      ]
    : [
        {
          label: t('dashboard.assignedTests'),
          value: String(availableInstruments.value.length),
          hint: `${availableInstruments.value.length - submittedAttempts.value.length} ta bajarilmagan`,
          icon: 'mdi-clipboard-text-outline',
          tint: 'rgb(var(--v-theme-primary))',
        },
        {
          label: t('dashboard.completed'),
          value: String(submittedAttempts.value.length),
          hint: submittedAttempts.value.length ? 'Natijalarni ko‘rish mumkin' : 'Hali topshirilmagan',
          icon: 'mdi-check-circle-outline',
          tint: 'rgb(var(--v-theme-success))',
        },
        { label: 'Yaqin qabul', value: '9-sen', hint: '10:00 · 305-xona', icon: 'mdi-calendar-heart', tint: 'rgb(var(--v-theme-secondary))' },
        {
          label: 'Pasport to‘liqligi',
          value: `${passportPct.value}%`,
          hint: passportPct.value === 100 ? 'To‘liq to‘ldirilgan' : 'To‘ldirishni yakunlang',
          icon: 'mdi-card-account-details-outline',
          tint: 'rgb(var(--v-theme-warning))',
          to: '/passport',
        },
      ],
)

const upcomingAppointments = computed(() =>
  calendarStore.events
    .filter((e) => new Date(e.date) >= TODAY && e.status !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4),
)
function formatUpcoming(e: CalEvent) {
  const d = new Date(e.date)
  return `${d.getDate()}-${MONTH_NAMES[d.getMonth()].toLowerCase()} · ${e.time}`
}

const quickActions = [
  { label: 'Murojaatlar', icon: 'mdi-message-text-outline', to: '/appeals' },
  { label: 'Test biriktirish', icon: 'mdi-clipboard-plus-outline', to: '/assignments/create' },
  { label: 'Guruh natijalari', icon: 'mdi-account-search-outline', to: '/tekshirish' },
  { label: 'Qabul qo‘shish', icon: 'mdi-calendar-plus', to: '/calendar' },
]

const topFaculties = [
  { name: 'Xorijiy filologiya fakulteti', groups: 3, students: 412, pct: 86 },
  { name: 'Tarix fakulteti', groups: 2, students: 268, pct: 71 },
  { name: 'Jurnalistika fakulteti', groups: 2, students: 190, pct: 69 },
]

</script>

<template>
  <div class="d-flex flex-column" style="gap: 24px">
    <header>
      <h1 class="text-display text-h4 font-weight-bold mb-1">{{ t('dashboard.greeting') }}, {{ firstName }}</h1>
      <p class="text-body-2 text-medium-emphasis mb-0">{{ subline }}</p>
    </header>

    <!-- Stat tiles -->
    <v-row dense>
      <v-col v-for="s in statTiles" :key="s.label" cols="12" sm="6" lg="3">
        <v-card
          class="surface-card pa-4 h-100"
          rounded="lg"
          :to="'to' in s ? (s as { to: string }).to : undefined"
        >
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-caption text-medium-emphasis">{{ s.label }}</span>
            <div class="icon-tile" :style="{ '--tint': s.tint }">
              <v-icon :icon="s.icon" size="20" />
            </div>
          </div>
          <div class="text-h4 text-display font-weight-bold">{{ s.value }}</div>
          <div class="text-caption text-medium-emphasis mt-1">{{ s.hint }}</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ================= STAFF ================= -->
    <template v-if="auth.isStaff">
      <v-row>
        <v-col cols="12" lg="7">
          <v-card class="surface-card pa-5 h-100" rounded="lg">
            <div class="d-flex align-center justify-space-between mb-3">
              <span class="text-subtitle-1 font-weight-bold">{{ t('dashboard.upcomingAppointment') }}</span>
              <v-btn size="small" variant="text" color="primary" to="/calendar" append-icon="mdi-arrow-right">
                {{ t('nav.calendar') }}
              </v-btn>
            </div>

            <div v-if="upcomingAppointments.length">
              <div
                v-for="(e, i) in upcomingAppointments"
                :key="i"
                class="d-flex align-center py-3 list-row"
                style="gap: 14px"
              >
                <div class="icon-tile" :style="{ '--tint': CAL_STATUS_META[e.status].color }">
                  <v-icon :icon="CAL_STATUS_META[e.status].icon" size="18" />
                </div>
                <div class="flex-grow-1">
                  <div class="text-body-2 font-weight-bold">{{ e.title }}</div>
                  <div class="text-caption text-medium-emphasis">{{ formatUpcoming(e) }}</div>
                </div>
                <v-chip size="small" variant="tonal" :color="e.status === 'free' ? 'success' : 'primary'">
                  {{ e.status === 'free' ? 'Bo‘sh' : 'Band' }}
                </v-chip>
              </div>
            </div>
            <v-empty-state
              v-else
              icon="mdi-calendar-check-outline"
              title="Rejalashtirilgan qabul yo‘q"
              density="comfortable"
            />
          </v-card>
        </v-col>

        <v-col cols="12" lg="5">
          <MiniCalendar />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" lg="7">
          <v-card class="surface-card pa-5 h-100" rounded="lg">
            <div class="text-subtitle-1 font-weight-bold mb-4">{{ t('dashboard.coverage') }}</div>
            <div v-for="f in topFaculties" :key="f.name" class="mb-4">
              <div class="d-flex align-center justify-space-between mb-2" style="gap: 12px">
                <span class="text-body-2 font-weight-medium">{{ f.name }}</span>
                <span class="text-body-2 font-weight-bold">{{ f.pct }}%</span>
              </div>
              <v-progress-linear :model-value="f.pct" height="8" rounded color="primary" bg-color="surface-variant" />
              <div class="text-caption text-medium-emphasis mt-1">{{ f.groups }} guruh · {{ f.students }} talaba</div>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" lg="5">
          <v-card class="surface-card pa-5 h-100" rounded="lg">
            <div class="text-subtitle-1 font-weight-bold mb-4">{{ t('dashboard.quickActions') }}</div>
            <div class="quick-grid">
              <button v-for="a in quickActions" :key="a.to" class="quick-action" @click="router.push(a.to)">
                <v-icon :icon="a.icon" size="22" color="primary" class="mb-2" />
                <span class="text-caption font-weight-medium">{{ a.label }}</span>
              </button>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- ================= STUDENT ================= -->
    <template v-else>
      <v-row>
        <v-col cols="12" lg="7">
          <v-card class="surface-card pa-5 h-100" rounded="lg">
            <div class="text-caption text-primary font-weight-bold text-uppercase mb-3">
              {{ t('dashboard.focusToday') }}
            </div>

            <template v-if="nextTest">
              <div class="d-flex align-center mb-3" style="gap: 12px">
                <div class="icon-tile" style="--tint: rgb(var(--v-theme-primary))">
                  <v-icon :icon="INSTRUMENT_META[nextTest.instrumentType].icon" size="20" />
                </div>
                <div>
                  <div class="text-h6 text-display font-weight-bold">{{ nextTest.title }}</div>
                  <div class="text-caption text-medium-emphasis">{{ nextTest.itemCount }} ta savol</div>
                </div>
              </div>
              <v-btn
                color="primary"
                :to="`/tests/${INSTRUMENT_META[nextTest.instrumentType].routeSegment}/take`"
                append-icon="mdi-arrow-right"
              >
                {{ attemptFor(nextTest.instrumentType) ? t('dashboard.continue') : t('dashboard.startTest') }}
              </v-btn>
            </template>
            <v-empty-state
              v-else
              icon="mdi-check-circle-outline"
              title="Barcha testlar bajarilgan"
              text="Yangi test tayinlanganda shu yerda ko‘rinadi."
              density="comfortable"
            />
          </v-card>
        </v-col>

        <v-col cols="12" lg="5">
          <v-card class="surface-card pa-5 h-100 d-flex flex-column" rounded="lg">
            <div class="text-subtitle-1 font-weight-bold mb-3">{{ t('dashboard.upcomingAppointment') }}</div>
            <div class="d-flex align-center mb-4" style="gap: 12px">
              <div class="icon-tile" style="--tint: rgb(var(--v-theme-secondary))">
                <v-icon icon="mdi-calendar-heart" size="20" />
              </div>
              <div>
                <div class="text-body-1 font-weight-bold">9-sentabr, 10:00</div>
                <div class="text-caption text-medium-emphasis">Psixolog N. Egamova · 305-xona</div>
              </div>
            </div>
            <v-spacer />
            <v-btn variant="tonal" color="secondary" block to="/appeals" prepend-icon="mdi-message-text-outline">
              Psixologga murojaat
            </v-btn>
          </v-card>
        </v-col>
      </v-row>

      <v-card class="surface-card" rounded="lg">
        <div class="pa-5 pb-2 text-subtitle-1 font-weight-bold">{{ t('nav.tests') }}</div>
        <v-list bg-color="transparent" lines="two">
          <v-list-item v-for="q in instruments" :key="q.instrumentType" class="px-5">
            <template #prepend>
              <div class="icon-tile mr-3" style="--tint: rgb(var(--v-theme-primary))">
                <v-icon :icon="INSTRUMENT_META[q.instrumentType].icon" size="19" />
              </div>
            </template>
            <v-list-item-title class="font-weight-bold">{{ q.title }}</v-list-item-title>
            <v-list-item-subtitle>
              <template v-if="!q.available">Tez orada</template>
              <template v-else-if="attemptFor(q.instrumentType)?.status === 'submitted'">
                Natija: {{ attemptFor(q.instrumentType)?.result?.label }}
              </template>
              <template v-else-if="attemptFor(q.instrumentType)">Boshlangan — davom ettiring</template>
              <template v-else>{{ q.itemCount }} ta savol</template>
            </v-list-item-subtitle>
            <template #append>
              <v-btn
                v-if="attemptFor(q.instrumentType)?.status === 'submitted'"
                variant="text"
                color="primary"
                size="small"
                :to="`/tests/${INSTRUMENT_META[q.instrumentType].routeSegment}/result`"
              >
                {{ t('common.view') }}
              </v-btn>
              <v-btn
                v-else-if="q.available"
                variant="tonal"
                color="primary"
                size="small"
                :to="`/tests/${INSTRUMENT_META[q.instrumentType].routeSegment}/take`"
              >
                {{ attemptFor(q.instrumentType) ? t('dashboard.continue') : t('dashboard.startTest') }}
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card>

      <v-card v-if="submittedAttempts.length" class="surface-card" rounded="lg">
        <div class="pa-5 pb-2 text-subtitle-1 font-weight-bold">{{ t('dashboard.recentResults') }}</div>
        <v-list bg-color="transparent" lines="two">
          <v-list-item
            v-for="r in submittedAttempts"
            :key="r.instrumentType"
            class="px-5"
            :to="`/tests/${INSTRUMENT_META[r.instrumentType].routeSegment}/result`"
          >
            <template #prepend>
              <div class="icon-tile mr-3" style="--tint: rgb(var(--v-theme-secondary))">
                <v-icon :icon="INSTRUMENT_META[r.instrumentType].icon" size="19" />
              </div>
            </template>
            <v-list-item-title class="font-weight-bold">{{ INSTRUMENT_META[r.instrumentType].label }}</v-list-item-title>
            <v-list-item-subtitle>{{ r.result?.description }}</v-list-item-subtitle>
            <template #append>
              <v-chip color="secondary" variant="tonal" size="small">{{ r.result?.label }}</v-chip>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </template>
  </div>
</template>

<style scoped>
.list-row {
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.7));
}
.list-row:last-child {
  border-bottom: none;
}

.quick-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 16px;
  border-radius: var(--radius);
  background: rgb(var(--v-theme-surface-variant));
  border: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.6));
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s var(--ease), transform 0.15s var(--ease);
}
.quick-action:hover {
  border-color: rgb(var(--v-theme-primary));
  transform: translateY(-2px);
}
</style>
