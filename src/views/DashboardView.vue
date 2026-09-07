<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import RotatingGlobe from '@/components/common/RotatingGlobe.vue'
import MiniCalendar from '@/components/dashboard/MiniCalendar.vue'
import { CAL_STATUS_META, TODAY, type CalEvent } from '@/mocks/calendar'
import { useCalendarStore } from '@/stores/calendar'
import { MONTH_NAMES } from '@/composables/useMonthGrid'
import type { ResultSummaryDto } from '@/types/domain'

const calendarStore = useCalendarStore()

const { t } = useI18n()
const auth = useAuthStore()

const firstName = computed(() => auth.user?.hemis.fullName.split(' ')[0] ?? '')

// Placeholder data — replaced once /student/assignments, /student/result and
// /admin/result/fakulty exist on the new backend (TZ §14, bosqich 2–3).
const statTiles = computed(() =>
  auth.isStaff
    ? [
        { label: 'Tayinlangan testlar', value: '18', delta: '+3', up: true, icon: 'mdi-clipboard-text-outline', color: '#0075FF' },
        { label: 'Faol murojaatlar', value: '5', delta: '+2', up: true, icon: 'mdi-message-alert-outline', color: '#E31A1A' },
        { label: 'Bugungi qabullar', value: '6', delta: '0', up: true, icon: 'mdi-calendar-heart', color: '#2CD9FF' },
        { label: 'O‘rtacha qamrov', value: '78%', delta: '+5%', up: true, icon: 'mdi-chart-arc', color: '#01B574' },
      ]
    : [
        { label: t('dashboard.assignedTests'), value: '4', delta: '', up: true, icon: 'mdi-clipboard-text-outline', color: '#0075FF' },
        { label: t('dashboard.completed'), value: '2', delta: '+1', up: true, icon: 'mdi-check-decagram-outline', color: '#01B574' },
        { label: 'Yaqin qabul', value: '9-sen', delta: '', up: true, icon: 'mdi-calendar-heart', color: '#2CD9FF' },
        { label: 'Profil holati', value: '90%', delta: '', up: true, icon: 'mdi-account-check-outline', color: '#FFB547' },
      ],
)

const gauge = computed(() =>
  auth.isStaff
    ? { pct: 78, label: 'Guruhlar qamrovi', hint: 'Test topshirgan talabalar' }
    : { pct: 50, label: 'Testlarni bajarish', hint: '4 tadan 2 tasi yakunlandi' },
)

const gaugeCircumference = Math.PI * 80
const gaugeOffset = computed(() => gaugeCircumference * (1 - gauge.value.pct / 100))

const scoreRing = computed(() =>
  auth.isStaff
    ? { value: '2.3s', pct: 88, label: 'Murojaatga javob tezligi' }
    : { value: '90%', pct: 90, label: 'Profil to‘liqligi' },
)
const ringCircumference = 2 * Math.PI * 54
const ringOffset = computed(() => ringCircumference * (1 - scoreRing.value.pct / 100))

// "Sales by Country"-style ranked list from the Vision UI reference —
// repurposed here as faculty coverage, the closest real equivalent to a
// per-segment breakdown in this domain (staff only).
const topFaculties = [
  { name: 'Xorijiy filologiya fakulteti', icon: 'mdi-translate', groups: 3, students: 412, pct: 86 },
  { name: 'Tarix fakulteti', icon: 'mdi-bank-outline', groups: 2, students: 268, pct: 71 },
  { name: 'Jurnalistika fakulteti', icon: 'mdi-newspaper-variant-outline', groups: 2, students: 190, pct: 69 },
]

const weekly = [42, 58, 50, 68, 61, 74, 66]
const weekDays = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']
const chartW = 560
const chartH = 180
const maxVal = 100
function xFor(i: number) {
  return (i / (weekly.length - 1)) * chartW
}
function yFor(v: number) {
  return chartH - (v / maxVal) * chartH
}
const linePoints = weekly.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ')
const areaPoints = `0,${chartH} ${linePoints} ${chartW},${chartH}`

const miniBars = [30, 55, 40, 70, 90, 65, 45, 80]

const quickStats = computed(() =>
  auth.isStaff
    ? [
        { label: 'Testlar', value: '12', icon: 'mdi-clipboard-text-outline', pct: 80 },
        { label: 'Tayinlashlar', value: '18', icon: 'mdi-clipboard-check-outline', pct: 65 },
        { label: 'Qabullar', value: '24', icon: 'mdi-calendar-heart', pct: 55 },
        { label: 'Murojaatlar', value: '5', icon: 'mdi-message-alert-outline', pct: 30 },
      ]
    : [
        { label: 'Testlar', value: '4', icon: 'mdi-clipboard-text-outline', pct: 50 },
        { label: 'Natijalar', value: '3', icon: 'mdi-chart-donut', pct: 75 },
        { label: 'Qabullar', value: '1', icon: 'mdi-calendar-heart', pct: 20 },
        { label: 'Murojaatlar', value: '0', icon: 'mdi-message-alert-outline', pct: 0 },
      ],
)

const upcomingAppointments = computed(() =>
  calendarStore.events.filter((e) => new Date(e.date) >= TODAY && e.status !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4),
)
function formatUpcoming(e: CalEvent) {
  const d = new Date(e.date)
  return `${d.getDate()}-${MONTH_NAMES[d.getMonth()].toLowerCase()}, ${e.time}`
}

const recentResults: (ResultSummaryDto & { title: string })[] = [
  { attemptId: 'a1', instrumentType: 'FREQUENCY_BASED', title: 'Temperament testi', label: 'Sangvinik', description: 'Ustuvor javoblar bo‘yicha aniqlangan' },
  { attemptId: 'a2', instrumentType: 'RANKING_BASED', title: 'Psixogeometrik test', label: 'Doira', description: '1-o‘rindagi figura asosida' },
  { attemptId: 'a3', instrumentType: 'SCORE_RANGE_BASED', title: 'Nevrasteniya so‘rovnomasi', label: '18 ball — past daraja', description: 'Ball oralig‘i xulosasi' },
]

const assignedTests = [
  { id: 't1', title: 'Temperament testi', deadline: '12-sentabr', questions: 20, pct: 100 },
  { id: 't2', title: 'Psixogeometrik test', deadline: '14-sentabr', questions: 5, pct: 100 },
  { id: 't3', title: 'Nevrasteniya so‘rovnomasi', deadline: '15-sentabr', questions: 24, pct: 0 },
]

function instrumentIcon(type: ResultSummaryDto['instrumentType']) {
  return {
    FREQUENCY_BASED: 'mdi-account-heart-outline',
    RANKING_BASED: 'mdi-shape-outline',
    SCORE_RANGE_BASED: 'mdi-gauge',
  }[type]
}

// ---------------------------------------------------------------------------
// Chart effects: draw-in animation on mount + hover tooltip/guide-line.
// Plain CSS transitions triggered by a class toggled after first paint —
// no charting library needed for two small SVGs.
// ---------------------------------------------------------------------------
const chartsAnimated = ref(false)
onMounted(async () => {
  await nextTick()
  requestAnimationFrame(() => {
    chartsAnimated.value = true
  })
})

const hoverIndex = ref<number | null>(null)
function onAreaHover(e: MouseEvent) {
  const svg = e.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  const localX = ((e.clientX - rect.left) / rect.width) * chartW
  let idx = 0
  let minDist = Infinity
  weekly.forEach((_, i) => {
    const d = Math.abs(xFor(i) - localX)
    if (d < minDist) {
      minDist = d
      idx = i
    }
  })
  hoverIndex.value = idx
}
function onAreaLeave() {
  hoverIndex.value = null
}
const tooltipLeftPct = computed(() => (hoverIndex.value === null ? 0 : (xFor(hoverIndex.value) / chartW) * 100))
</script>

<template>
  <div>
    <h1 class="text-display text-h4 font-weight-800 mb-1">{{ t('dashboard.greeting') }}, {{ firstName }} 👋</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">{{ auth.user?.hemis.faculty }} · {{ auth.user?.hemis.group }}</p>

    <!-- Stat tiles (chap) + ochiq holda aylanuvchi globus (o'ng, karta/matnsiz) -->
    <v-row>
      <v-col cols="12" lg="7">
        <v-row>
          <v-col v-for="s in statTiles" :key="s.label" cols="12" sm="6">
            <v-card class="pa-4 surface-glass wave-card h-100" rounded="xl">
              <div class="d-flex align-center justify-space-between mb-3">
                <span class="text-caption text-medium-emphasis">{{ s.label }}</span>
                <div class="icon-badge" :style="{ background: s.color }">
                  <v-icon :icon="s.icon" color="white" size="20" />
                </div>
              </div>
              <div class="d-flex align-baseline" style="gap: 8px">
                <span class="text-h4 font-weight-800">{{ s.value }}</span>
                <span v-if="s.delta" class="text-caption font-weight-700" :class="s.up ? 'text-success' : 'text-error'">
                  {{ s.delta }}
                </span>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <v-col cols="12" lg="5">
        <div class="globe-bare">
          <RotatingGlobe />
        </div>
      </v-col>
    </v-row>

    <!-- Mini kalendar (faqat xodim) + Yaqinlashib kelayotgan qabullar -->
    <v-row class="mt-1">
      <v-col v-if="auth.isStaff" cols="12" md="6">
        <MiniCalendar />
      </v-col>
      <v-col cols="12" :md="auth.isStaff ? 6 : 12">
        <v-card class="surface-glass h-100 pa-4 pa-md-5" rounded="xl">
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-subtitle-1 font-weight-800">Yaqinlashib kelayotgan qabullar</span>
            <v-icon icon="mdi-calendar-heart" color="secondary" />
          </div>
          <div v-for="(e, i) in upcomingAppointments" :key="i" class="d-flex align-center py-2 upcoming-row" style="gap: 12px">
            <div class="icon-badge" style="width: 38px; height: 38px; border-radius: 11px" :style="{ background: `${CAL_STATUS_META[e.status].color}26` }">
              <v-icon :icon="CAL_STATUS_META[e.status].icon" :color="e.status === 'free' ? 'success' : 'primary'" size="18" />
            </div>
            <div class="flex-grow-1">
              <div class="text-body-2 font-weight-700">{{ e.title }}</div>
              <div class="text-caption text-medium-emphasis">{{ formatUpcoming(e) }}</div>
            </div>
          </div>
          <v-empty-state v-if="!upcomingAppointments.length" icon="mdi-calendar-check-outline" title="Rejalashtirilgan qabul yo‘q" density="compact" />
          <v-btn v-if="auth.isStaff" variant="tonal" color="secondary" size="small" to="/calendar" class="text-none mt-2">
            {{ t('dashboard.bookAppointment') }}
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Gauge + score ring -->
    <v-row class="mt-1">
      <v-col cols="12" sm="6">
        <v-card class="surface-glass h-100 pa-5 text-center" rounded="xl">
          <div class="text-caption text-medium-emphasis mb-1">{{ gauge.label }}</div>
          <svg viewBox="0 0 200 120" class="gauge-svg">
            <defs>
              <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#0075FF" />
                <stop offset="1" stop-color="#2CD9FF" />
              </linearGradient>
            </defs>
            <path d="M20,100 A80,80 0 0 1 180,100" fill="none" stroke="rgba(128,128,128,0.2)" stroke-width="14" stroke-linecap="round" />
            <path
              d="M20,100 A80,80 0 0 1 180,100"
              fill="none"
              stroke="url(#heroGrad)"
              stroke-width="14"
              stroke-linecap="round"
              :stroke-dasharray="gaugeCircumference"
              :stroke-dashoffset="chartsAnimated ? gaugeOffset : gaugeCircumference"
              class="gauge-arc"
            />
          </svg>
          <div class="gauge-center">
            <v-icon icon="mdi-emoticon-happy-outline" color="secondary" size="26" />
          </div>
          <div class="d-flex justify-space-between text-caption text-medium-emphasis px-2">
            <span>0%</span><span>100%</span>
          </div>
          <div class="text-h5 font-weight-800 mt-1">{{ gauge.pct }}%</div>
          <div class="text-caption text-medium-emphasis">{{ gauge.hint }}</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6">
        <v-card class="surface-glass h-100 pa-5 text-center d-flex flex-column align-center justify-center" rounded="xl">
          <div class="text-caption text-medium-emphasis mb-3">{{ scoreRing.label }}</div>
          <svg viewBox="0 0 120 120" width="120" height="120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(128,128,128,0.2)" stroke-width="10" />
            <circle
              cx="60" cy="60" r="54" fill="none" stroke="#01B574" stroke-width="10" stroke-linecap="round"
              :stroke-dasharray="ringCircumference" :stroke-dashoffset="chartsAnimated ? ringOffset : ringCircumference"
              transform="rotate(-90 60 60)" class="ring-arc"
            />
            <text x="60" y="66" text-anchor="middle" font-size="22" font-weight="800" fill="currentColor">{{ scoreRing.value }}</text>
          </svg>
          <div class="text-caption text-medium-emphasis mt-2">Umumiy ko‘rsatkich</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Fakultetlar reytingi (staff) — "Sales by Country" patterni -->
    <v-row v-if="auth.isStaff" class="mt-1">
      <v-col cols="12">
        <v-card class="surface-glass pa-5" rounded="xl">
          <div class="text-subtitle-1 font-weight-700 mb-4">Fakultetlar bo‘yicha qamrov</div>
          <div class="faculty-rank-row d-flex align-center py-2" v-for="f in topFaculties" :key="f.name">
            <div class="icon-badge mr-3" style="width: 36px; height: 36px; border-radius: 10px; background: rgba(0,117,255,0.16)">
              <v-icon :icon="f.icon" color="primary" size="17" />
            </div>
            <span class="font-weight-700 flex-grow-1">{{ f.name }}</span>
            <div class="d-none d-sm-block text-center" style="width: 110px">
              <div class="text-caption text-medium-emphasis">Guruhlar</div>
              <div class="text-body-2 font-weight-700">{{ f.groups }}</div>
            </div>
            <div class="d-none d-sm-block text-center" style="width: 110px">
              <div class="text-caption text-medium-emphasis">Talabalar</div>
              <div class="text-body-2 font-weight-700">{{ f.students }}</div>
            </div>
            <div class="text-center" style="width: 130px">
              <div class="text-caption text-medium-emphasis">Qamrov</div>
              <div class="text-body-2 font-weight-700">{{ f.pct }}%</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Weekly activity area chart (draw-in + hover tooltip) + animated bar chart -->
    <v-row class="mt-1">
      <v-col cols="12" md="7">
        <v-card class="surface-glass pa-5" rounded="xl">
          <div class="d-flex align-center justify-space-between mb-4">
            <div>
              <div class="text-subtitle-1 font-weight-700">Haftalik faollik</div>
              <span class="text-caption text-success font-weight-700">+12% <span class="text-medium-emphasis font-weight-500">bu hafta</span></span>
            </div>
            <v-icon icon="mdi-chart-line" color="secondary" />
          </div>
          <div class="chart-wrap" @mousemove="onAreaHover" @mouseleave="onAreaLeave">
            <svg :viewBox="`0 0 ${chartW} ${chartH + 24}`" class="area-chart">
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stop-color="#2CD9FF" stop-opacity="0.45" />
                  <stop offset="1" stop-color="#2CD9FF" stop-opacity="0" />
                </linearGradient>
              </defs>
              <line v-for="g in 4" :key="g" x1="0" :x2="chartW" :y1="(chartH / 4) * g" :y2="(chartH / 4) * g" stroke="rgba(128,128,128,0.15)" stroke-dasharray="4 4" />
              <line
                v-if="hoverIndex !== null" class="chart-guide"
                :x1="xFor(hoverIndex)" :x2="xFor(hoverIndex)" y1="0" :y2="chartH"
              />
              <polygon :points="areaPoints" fill="url(#areaFill)" class="chart-area" :class="{ 'chart-area--in': chartsAnimated }" />
              <polyline
                :points="linePoints" fill="none" stroke="#0075FF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
                class="chart-line" :class="{ 'chart-line--in': chartsAnimated }"
              />
              <circle
                v-for="(v, i) in weekly" :key="i" :cx="xFor(i)" :cy="yFor(v)"
                :r="hoverIndex === i ? 5.5 : 3.5" fill="#0075FF" class="chart-dot"
                :class="{ 'chart-dot--active': hoverIndex === i }"
              />
              <text v-for="(d, i) in weekDays" :key="d" :x="xFor(i)" :y="chartH + 18" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.55">{{ d }}</text>
            </svg>
            <div v-if="hoverIndex !== null" class="chart-tooltip" :style="{ left: tooltipLeftPct + '%' }">
              <div class="text-caption font-weight-800">{{ weekDays[hoverIndex] }}</div>
              <div class="text-caption text-secondary font-weight-700">{{ weekly[hoverIndex] }} faollik</div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card class="surface-glass pa-5 h-100" rounded="xl">
          <div class="text-subtitle-1 font-weight-700 mb-3">So‘nggi 8 kun</div>
          <svg viewBox="0 0 240 90" class="bar-chart mb-4">
            <rect
              v-for="(b, i) in miniBars" :key="i" :x="i * 30 + 6"
              :y="chartsAnimated ? 90 - b * 0.8 : 90" width="16" :height="chartsAnimated ? b * 0.8 : 0" rx="4"
              fill="#0075FF" :opacity="0.4 + (i / miniBars.length) * 0.6"
              class="bar-rect" :style="{ transitionDelay: `${i * 45}ms` }"
            />
          </svg>
          <div class="d-flex flex-column" style="gap: 14px">
            <div v-for="q in quickStats" :key="q.label">
              <div class="d-flex align-center justify-space-between mb-1">
                <span class="d-flex align-center text-caption text-medium-emphasis" style="gap: 6px">
                  <v-icon :icon="q.icon" size="15" />{{ q.label }}
                </span>
                <span class="text-body-2 font-weight-700">{{ q.value }}</span>
              </div>
              <v-progress-linear :model-value="chartsAnimated ? q.pct : 0" height="5" rounded color="secondary" bg-color="surface-variant" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Progress table + list -->
    <v-row class="mt-1">
      <v-col cols="12" md="7">
        <v-card class="surface-glass" rounded="xl">
          <v-card-item>
            <v-card-title class="text-subtitle-1 font-weight-700">{{ t('nav.tests') }}</v-card-title>
          </v-card-item>
          <v-divider opacity="0.1" />
          <v-list lines="two" bg-color="transparent">
            <v-list-item v-for="test in assignedTests" :key="test.id">
              <template #prepend>
                <div class="icon-badge" style="background: rgba(0,117,255,0.16)">
                  <v-icon icon="mdi-file-document-edit-outline" color="primary" size="20" />
                </div>
              </template>
              <v-list-item-title class="font-weight-700 ml-3">{{ test.title }}</v-list-item-title>
              <v-list-item-subtitle class="ml-3">
                <div class="d-flex align-center" style="gap: 10px">
                  <span>{{ test.questions }} savol · muddat: {{ test.deadline }}</span>
                </div>
                <v-progress-linear :model-value="test.pct" height="5" rounded color="primary" bg-color="surface-variant" class="mt-1" style="max-width: 200px" />
              </v-list-item-subtitle>
              <template #append>
                <v-btn variant="tonal" color="primary" size="small" class="text-none">
                  {{ test.pct === 100 ? 'Ko‘rish' : t('dashboard.startTest') }}
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card class="surface-glass" rounded="xl">
          <v-card-item>
            <v-card-title class="text-subtitle-1 font-weight-700">{{ t('dashboard.recentResults') }}</v-card-title>
          </v-card-item>
          <v-divider opacity="0.1" />
          <v-list bg-color="transparent">
            <v-list-item v-for="r in recentResults" :key="r.attemptId">
              <template #prepend>
                <div class="icon-badge" style="background: rgba(44,217,255,0.16)">
                  <v-icon :icon="instrumentIcon(r.instrumentType)" color="secondary" size="20" />
                </div>
              </template>
              <v-list-item-title class="font-weight-700 ml-3">{{ r.title }}</v-list-item-title>
              <v-list-item-subtitle class="ml-3">{{ r.description }}</v-list-item-subtitle>
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

<style scoped>
.globe-bare {
  height: 100%;
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.gauge-svg {
  width: 100%;
  max-width: 180px;
}

.gauge-center {
  margin-top: -58px;
  margin-bottom: 34px;
}

.gauge-arc,
.ring-arc {
  transition: stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.area-chart,
.bar-chart {
  width: 100%;
  height: auto;
  overflow: visible;
}

.chart-wrap {
  position: relative;
}

.chart-line {
  stroke-dasharray: 1600;
  stroke-dashoffset: 1600;
  transition: stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 0 6px rgba(0, 117, 255, 0.55));
}
.chart-line--in {
  stroke-dashoffset: 0;
}

.chart-area {
  opacity: 0;
  transition: opacity 1.1s ease 0.35s;
}
.chart-area--in {
  opacity: 1;
}

.chart-dot {
  transition: r 0.15s ease;
  filter: drop-shadow(0 0 4px rgba(0, 117, 255, 0.7));
}
.chart-dot--active {
  fill: #2cd9ff;
}

.chart-guide {
  stroke: rgba(44, 217, 255, 0.5);
  stroke-width: 1.5;
  stroke-dasharray: 3 3;
}

.chart-tooltip {
  position: absolute;
  top: -6px;
  transform: translate(-50%, -100%);
  background: rgba(15, 22, 55, 0.95);
  border: 1px solid rgba(44, 217, 255, 0.35);
  border-radius: 8px;
  padding: 6px 10px;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 8px 20px -6px rgba(0, 0, 0, 0.6);
}

.bar-rect {
  transition: height 0.8s cubic-bezier(0.4, 0, 0.2, 1), y 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease;
}
.bar-rect:hover {
  opacity: 1;
}

.faculty-rank-row {
  border-bottom: 1px solid rgba(128, 128, 128, 0.15);
}
.faculty-rank-row:last-child {
  border-bottom: none;
}
</style>
