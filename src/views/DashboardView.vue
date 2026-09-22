<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MiniCalendar from '@/components/dashboard/MiniCalendar.vue'
import { CAL_STATUS_META, TODAY, type CalEvent } from '@/mocks/calendar'
import { useCalendarStore } from '@/stores/calendar'
import { formatDay } from '@/utils/datetime'
import { INSTRUMENT_META, instrumentLabel } from '@/utils/instruments'
import { listInstruments } from '@/services/quizService'
import { getAttempts } from '@/services/attemptService'
import { useAppealsStore } from '@/stores/appeals'
import { usePassportStore, completeness } from '@/stores/passport'
import { api } from '@/services/apiClient'
import { members } from '@/services/quizService'
import type { InstrumentType, StudyLanguage } from '@/types/domain'
import type { StoredAttempt } from '@/types/assessment'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()
const calendarStore = useCalendarStore()
const appealsStore = useAppealsStore()
const passportStore = usePassportStore()

if (auth.isTutor) {
  // Tyutor — murojaat/kalendar/pasport unga aloqasi yo'q, faqat o'z
  // guruhi ro'yxati kerak.
} else {
  appealsStore.load()
  calendarStore.load()
  if (auth.user?.role === 'student') passportStore.load()
}

const assignmentCount = ref(0)
if (auth.isStaff) {
  api.get('/assignments').then((r) => (assignmentCount.value = members(r.data).length)).catch(() => {})
}

// --- Tyutor: o'z guruhi talabalari + kuzatuv kartasi holati -------------
interface TutorStudentRow {
  id: number
  hasObservationCard: boolean
  studyGroup: { id: number; name: string } | null
}
const tutorStudents = ref<TutorStudentRow[]>([])
if (auth.isTutor) {
  api.get<TutorStudentRow[]>('/tutor/students').then((r) => (tutorStudents.value = r.data)).catch(() => {})
}
const tutorGroups = computed(() => {
  const byId = new Map<number, { id: number; name: string; total: number; filled: number }>()
  for (const s of tutorStudents.value) {
    if (!s.studyGroup) continue
    const g = byId.get(s.studyGroup.id) ?? { id: s.studyGroup.id, name: s.studyGroup.name, total: 0, filled: 0 }
    g.total++
    if (s.hasObservationCard) g.filled++
    byId.set(s.studyGroup.id, g)
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
})
const tutorFilledCount = computed(() => tutorStudents.value.filter((s) => s.hasObservationCard).length)
const tutorPendingCount = computed(() => tutorStudents.value.length - tutorFilledCount.value)

const todayKey = new Date().toISOString().slice(0, 10)
const todaysAppointments = computed(
  () => calendarStore.events.filter((e) => e.date === todayKey && e.status === 'booked').length,
)
const freeSlots = computed(() => calendarStore.events.filter((e) => e.status === 'free').length)
/** Talaba uchun — psixolog kalendaridagi ixtiyoriy voqea emas, aynan shu
 * talabaning o'ziga tasdiqlangan qabuli (murojaat orqali). */
const myNextAppointment = computed(() =>
  [...appealsStore.appeals]
    .filter((a) => a.appointmentDate && a.appointmentDate >= todayKey)
    .sort((a, b) => (a.appointmentDate! + (a.appointmentStartTime ?? '')).localeCompare(b.appointmentDate! + (b.appointmentStartTime ?? '')))[0],
)

const passportPct = computed(() => completeness(passportStore.get(auth.user?.hemis.hemisId ?? 'anon')))

// Student's real quiz catalogue + attempts.
const instruments = ref<Awaited<ReturnType<typeof listInstruments>>>([])
const attempts = ref<StoredAttempt[]>([])
if (auth.user?.role === 'student') {
  const lang = (auth.user?.hemis.studyLanguage ?? 'uz') as StudyLanguage
  Promise.all([listInstruments(lang), getAttempts(auth.user?.hemis.hemisId ?? 'anon')]).then(([qs, at]) => {
    instruments.value = qs
    attempts.value = at
  })
}
const attemptFor = (i: InstrumentType) => attempts.value.find((a) => a.instrumentType === i)
const availableInstruments = computed(() => instruments.value.filter((q) => q.available))
/** Biriktirilgan yoki allaqachon ishlangan testlargina ro'yxatda. */
const visibleInstruments = computed(() =>
  instruments.value.filter((q) => q.available || attemptFor(q.instrumentType)),
)
const submittedAttempts = computed(() => attempts.value.filter((a) => a.status === 'submitted'))
const nextTest = computed(() =>
  availableInstruments.value.find((q) => attemptFor(q.instrumentType)?.status !== 'submitted'),
)

const firstName = computed(() => auth.user?.hemis.fullName.split(' ')[0] ?? '')
const subline = computed(() => {
  if (auth.isTutor) return `${tutorGroups.value.length} ta guruh · ${tutorStudents.value.length} ta talaba`
  return auth.isStaff ? auth.user?.hemis.faculty : `${auth.user?.hemis.faculty} · ${auth.user?.hemis.group}`
})

const statTiles = computed(() => {
  if (auth.isTutor) {
    return [
      { label: 'Mening guruhlarim', value: String(tutorGroups.value.length), hint: 'Biriktirilgan', icon: 'mdi-account-group-outline', tint: 'rgb(var(--v-theme-primary))', to: '/tutor/students' },
      { label: 'Talabalar', value: String(tutorStudents.value.length), hint: 'Jami', icon: 'mdi-account-multiple-outline', tint: 'rgb(var(--v-theme-secondary))', to: '/tutor/students' },
      { label: 'Kuzatuv kartasi to‘ldirilgan', value: String(tutorFilledCount.value), hint: '10-metodika', icon: 'mdi-clipboard-check-outline', tint: 'rgb(var(--v-theme-success))', to: '/tutor/students' },
      { label: 'Hali to‘ldirilmagan', value: String(tutorPendingCount.value), hint: 'Kutilmoqda', icon: 'mdi-clipboard-text-outline', tint: 'rgb(var(--v-theme-warning))', to: '/tutor/students' },
    ]
  }
  return auth.isStaff
    ? [
        { label: 'Biriktirilgan testlar', value: String(assignmentCount.value), hint: 'Guruhlarga', icon: 'mdi-clipboard-text-outline', tint: 'rgb(var(--v-theme-primary))', to: '/assignments' },
        { label: 'Faol murojaatlar', value: String(appealsStore.openCount), hint: 'Javob kutmoqda', icon: 'mdi-message-text-outline', tint: 'rgb(var(--v-theme-error))', to: '/appeals' },
        { label: 'Bugungi qabullar', value: String(todaysAppointments.value), hint: 'Band slotlar', icon: 'mdi-calendar-heart', tint: 'rgb(var(--v-theme-secondary))', to: '/calendar' },
        { label: 'Bo‘sh slotlar', value: String(freeSlots.value), hint: 'Kalendarda', icon: 'mdi-calendar-blank-outline', tint: 'rgb(var(--v-theme-success))', to: '/calendar' },
      ]
    : [
        {
          label: t('dashboard.assignedTests'),
          value: String(availableInstruments.value.length),
          hint: t('dashboard.notDone', { n: availableInstruments.value.length - submittedAttempts.value.length }),
          icon: 'mdi-clipboard-text-outline',
          tint: 'rgb(var(--v-theme-primary))',
        },
        {
          label: t('dashboard.completed'),
          value: String(submittedAttempts.value.length),
          hint: submittedAttempts.value.length ? t('dashboard.canViewResults') : t('dashboard.notSubmittedYet'),
          icon: 'mdi-check-circle-outline',
          tint: 'rgb(var(--v-theme-success))',
        },
        {
          label: t('dashboard.nearAppointment'),
          value: myNextAppointment.value ? formatDay(myNextAppointment.value.appointmentDate!, { short: true }) : '—',
          hint: myNextAppointment.value
            ? `${myNextAppointment.value.appointmentStartTime}–${myNextAppointment.value.appointmentEndTime}`
            : t('dashboard.notScheduled'),
          icon: 'mdi-calendar-heart',
          tint: 'rgb(var(--v-theme-secondary))',
        },
        {
          label: t('dashboard.passportCompleteness'),
          value: `${passportPct.value}%`,
          hint: passportPct.value === 100 ? t('dashboard.passportFull') : t('dashboard.passportFinish'),
          icon: 'mdi-card-account-details-outline',
          tint: 'rgb(var(--v-theme-warning))',
          to: '/passport',
        },
      ]
})

const upcomingAppointments = computed(() =>
  calendarStore.events
    .filter((e) => new Date(e.date) >= TODAY && e.status !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4),
)
function formatUpcoming(e: CalEvent) {
  return `${formatDay(e.date)} · ${e.time}`
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

    <!-- ================= TYUTOR ================= -->
    <template v-if="auth.isTutor">
      <v-card class="surface-card pa-5" rounded="lg">
        <div class="d-flex align-center justify-space-between mb-4">
          <span class="text-subtitle-1 font-weight-bold">Guruhlarim bo‘yicha kuzatuv kartasi holati</span>
          <v-btn size="small" variant="text" color="primary" to="/tutor/students" append-icon="mdi-arrow-right">
            Mening guruhim
          </v-btn>
        </div>

        <div v-if="tutorGroups.length">
          <div v-for="g in tutorGroups" :key="g.id" class="mb-4">
            <div class="d-flex align-center justify-space-between mb-2" style="gap: 12px">
              <span class="text-body-2 font-weight-medium">{{ g.name }}</span>
              <span class="text-body-2 font-weight-bold">{{ g.filled }}/{{ g.total }}</span>
            </div>
            <v-progress-linear
              :model-value="g.total ? (g.filled / g.total) * 100 : 0"
              height="8"
              rounded
              color="primary"
              bg-color="surface-variant"
            />
          </div>
        </div>
        <v-empty-state
          v-else
          icon="mdi-account-group-outline"
          title="Sizga hali guruh biriktirilmagan"
          density="comfortable"
        />
      </v-card>
    </template>

    <!-- ================= STAFF ================= -->
    <template v-else-if="auth.isStaff">
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
                  {{ e.status === 'free' ? t('dashboard.free') : t('dashboard.busy') }}
                </v-chip>
              </div>
            </div>
            <v-empty-state
              v-else
              icon="mdi-calendar-check-outline"
              :title="t('dashboard.noPlannedAppointment')"
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
              <div class="text-caption text-medium-emphasis mt-1">{{ t('dashboard.groupsStudents', { groups: f.groups, students: f.students }) }}</div>
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
                  <div class="text-caption text-medium-emphasis">{{ t('dashboard.questionCount', { n: nextTest.itemCount }) }}</div>
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
              :title="t('dashboard.allTestsDone')"
              :text="t('dashboard.allTestsDoneHint')"
              density="comfortable"
            />
          </v-card>
        </v-col>

        <v-col cols="12" lg="5">
          <v-card class="surface-card pa-5 h-100 d-flex flex-column" rounded="lg">
            <div class="text-subtitle-1 font-weight-bold mb-3">{{ t('dashboard.upcomingAppointment') }}</div>
            <div v-if="myNextAppointment" class="d-flex align-center mb-4" style="gap: 12px">
              <div class="icon-tile" style="--tint: rgb(var(--v-theme-secondary))">
                <v-icon icon="mdi-calendar-heart" size="20" />
              </div>
              <div>
                <div class="text-body-1 font-weight-bold">
                  {{ formatDay(myNextAppointment.appointmentDate!) }}, {{ myNextAppointment.appointmentStartTime }}–{{ myNextAppointment.appointmentEndTime }}
                </div>
                <div class="text-caption text-medium-emphasis">{{ t('dashboard.myAppointmentHint') }}</div>
              </div>
            </div>
            <div v-else class="text-body-2 text-medium-emphasis mb-4">{{ t('dashboard.noScheduledAppointment') }}</div>
            <v-spacer />
            <v-btn variant="tonal" color="secondary" block to="/appeals" prepend-icon="mdi-message-text-outline">
              {{ t('dashboard.contactPsychologist') }}
            </v-btn>
          </v-card>
        </v-col>
      </v-row>

      <v-card v-if="visibleInstruments.length" class="surface-card" rounded="lg">
        <div class="pa-5 pb-2 text-subtitle-1 font-weight-bold">{{ t('nav.tests') }}</div>
        <v-list bg-color="transparent" lines="two">
          <v-list-item v-for="q in visibleInstruments" :key="q.instrumentType" class="px-5">
            <template #prepend>
              <div class="icon-tile mr-3" style="--tint: rgb(var(--v-theme-primary))">
                <v-icon :icon="INSTRUMENT_META[q.instrumentType].icon" size="19" />
              </div>
            </template>
            <v-list-item-title class="font-weight-bold">{{ q.title }}</v-list-item-title>
            <v-list-item-subtitle>
              <template v-if="!q.available">{{ t('dashboard.comingSoon') }}</template>
              <template v-else-if="attemptFor(q.instrumentType)?.status === 'submitted'">
                {{ t('dashboard.resultLabel') }}: {{ attemptFor(q.instrumentType)?.result?.label }}
              </template>
              <template v-else-if="attemptFor(q.instrumentType)">{{ t('dashboard.startedContinue') }}</template>
              <template v-else>{{ t('dashboard.questionCount', { n: q.itemCount }) }}</template>
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
            <v-list-item-title class="font-weight-bold">{{ instrumentLabel(r.instrumentType) }}</v-list-item-title>
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
