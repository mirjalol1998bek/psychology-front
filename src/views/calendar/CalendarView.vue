<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AppointmentSlotStatus } from '@/types/domain'

interface CalEvent {
  date: string // YYYY-MM-DD
  title: string
  time: string
  status: AppointmentSlotStatus
}

const WEEKDAYS = ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak']
const MONTH_NAMES = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
]

const today = new Date(2026, 8, 4) // TODO(backend): replace with real `new Date()` once slots are live
const cursor = ref(new Date(today.getFullYear(), today.getMonth(), 1))

const monthLabel = computed(() => `${MONTH_NAMES[cursor.value.getMonth()]} ${cursor.value.getFullYear()}`)

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// Placeholder — wired to the psychologist's real slot list later (TZ §9).
const events: CalEvent[] = [
  { date: '2026-09-01', title: 'Kirish so‘rovnomasi', time: 'Kun bo‘yi', status: 'booked' },
  { date: '2026-09-04', title: 'A. Karimov', time: '09:30', status: 'booked' },
  { date: '2026-09-04', title: 'Bo‘sh slot', time: '11:00', status: 'free' },
  { date: '2026-09-07', title: 'Guruh treningi', time: '14:00', status: 'booked' },
  { date: '2026-09-09', title: 'Siz', time: '10:00', status: 'booked' },
  { date: '2026-09-09', title: 'Bo‘sh slot', time: '10:30', status: 'free' },
  { date: '2026-09-14', title: 'M. Yusupova', time: '15:00', status: 'booked' },
  { date: '2026-09-18', title: 'Bekor qilingan', time: '13:00', status: 'cancelled' },
  { date: '2026-09-22', title: 'Fakultet monitoring', time: 'Kun bo‘yi', status: 'booked' },
]

const statusMeta: Record<AppointmentSlotStatus, { color: string; icon: string }> = {
  free: { color: '#01B574', icon: 'mdi-calendar-plus-outline' },
  booked: { color: '#0075FF', icon: 'mdi-account-check-outline' },
  cancelled: { color: '#E31A1A', icon: 'mdi-calendar-remove-outline' },
}

const weeks = computed(() => {
  const year = cursor.value.getFullYear()
  const month = cursor.value.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  // Monday-start offset (0 = Monday ... 6 = Sunday)
  const offset = (firstOfMonth.getDay() + 6) % 7
  const gridStart = new Date(year, month, 1 - offset)

  const cells = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + i)
    const key = toKey(date)
    return {
      date,
      key,
      inMonth: date.getMonth() === month,
      isToday: isSameDay(date, today),
      events: events.filter((e) => e.date === key),
    }
  })

  const result = []
  for (let i = 0; i < 6; i++) result.push(cells.slice(i * 7, i * 7 + 7))
  return result
})

function prevMonth() {
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() - 1, 1)
}
function nextMonth() {
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + 1, 1)
}
function goToday() {
  cursor.value = new Date(today.getFullYear(), today.getMonth(), 1)
}

const upcoming = computed(() =>
  events
    .filter((e) => new Date(e.date) >= today && e.status !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4),
)

function formatUpcoming(e: CalEvent) {
  const d = new Date(e.date)
  return `${d.getDate()}-${MONTH_NAMES[d.getMonth()].toLowerCase()}, ${e.time}`
}

const activity = [4, 6, 5, 8, 7, 9, 6]
const activityDays = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']
const chartW = 260
const chartH = 90
function xFor(i: number) {
  return (i / (activity.length - 1)) * chartW
}
function yFor(v: number) {
  return chartH - (v / 10) * chartH
}
const linePoints = activity.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ')
const areaPoints = `0,${chartH} ${linePoints} ${chartW},${chartH}`
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap" style="gap: 12px">
      <div>
        <h1 class="text-display text-h4 font-weight-800 mb-1">Qabul kalendari</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">Psixolog Nilufar Egamova — oylik jadval</p>
      </div>
      <v-btn color="primary" class="text-none" prepend-icon="mdi-calendar-plus" icon="mdi-plus" rounded="xl" />
    </div>

    <v-row>
      <v-col cols="12" lg="8">
        <v-card class="surface-glass pa-4 pa-md-5" rounded="xl">
          <div class="d-flex align-center justify-space-between mb-4">
            <span class="text-h6 font-weight-800">{{ monthLabel }}</span>
            <div class="d-flex align-center" style="gap: 6px">
              <v-btn size="small" variant="tonal" class="text-none" @click="goToday">Bugun</v-btn>
              <v-btn icon="mdi-chevron-left" size="small" variant="text" @click="prevMonth" />
              <v-btn icon="mdi-chevron-right" size="small" variant="text" @click="nextMonth" />
            </div>
          </div>

          <div class="month-grid">
            <div v-for="d in WEEKDAYS" :key="d" class="weekday-label">{{ d }}</div>
            <template v-for="(week, wi) in weeks" :key="wi">
              <div
                v-for="cell in week" :key="cell.key"
                class="day-cell" :class="{ 'day-cell--out': !cell.inMonth, 'day-cell--today': cell.isToday }"
              >
                <span class="day-num">{{ cell.date.getDate() }}</span>
                <div class="d-flex flex-column" style="gap: 3px">
                  <div
                    v-for="(ev, ei) in cell.events.slice(0, 2)" :key="ei"
                    class="event-pill" :style="{ background: statusMeta[ev.status].color }"
                    :title="`${ev.title} — ${ev.time}`"
                  >
                    {{ ev.title }}
                  </div>
                  <div v-if="cell.events.length > 2" class="text-caption text-medium-emphasis pl-1">
                    +{{ cell.events.length - 2 }} ko‘proq
                  </div>
                </div>
              </div>
            </template>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="surface-glass pa-4 mb-4" rounded="xl">
          <div class="text-subtitle-1 font-weight-700 mb-3">Yaqin qabullar</div>
          <div v-for="(e, i) in upcoming" :key="i" class="d-flex align-center py-2" style="gap: 12px">
            <div class="icon-badge" style="width: 36px; height: 36px; border-radius: 10px" :style="{ background: `${statusMeta[e.status].color}26` }">
              <v-icon :icon="statusMeta[e.status].icon" :color="e.status === 'free' ? 'success' : 'primary'" size="17" />
            </div>
            <div>
              <div class="text-body-2 font-weight-700">{{ e.title }}</div>
              <div class="text-caption text-medium-emphasis">{{ formatUpcoming(e) }}</div>
            </div>
          </div>
          <v-empty-state v-if="!upcoming.length" icon="mdi-calendar-check-outline" title="Rejalashtirilgan qabul yo‘q" density="compact" />
        </v-card>

        <v-card class="surface-glass pa-4" rounded="xl">
          <div class="text-subtitle-1 font-weight-700 mb-1">Faollik</div>
          <span class="text-caption text-success font-weight-700">+8% <span class="text-medium-emphasis font-weight-500">bu hafta</span></span>
          <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="mini-area mt-2">
            <defs>
              <linearGradient id="calAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#0075FF" stop-opacity="0.5" />
                <stop offset="1" stop-color="#0075FF" stop-opacity="0" />
              </linearGradient>
            </defs>
            <polygon :points="areaPoints" fill="url(#calAreaFill)" />
            <polyline :points="linePoints" fill="none" stroke="#0075FF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <div class="d-flex justify-space-between text-caption text-medium-emphasis px-1">
            <span v-for="d in activityDays" :key="d">{{ d }}</span>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.month-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.weekday-label {
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.55;
  padding-bottom: 6px;
}

.day-cell {
  min-height: 84px;
  border-radius: 12px;
  background: rgba(128, 128, 128, 0.05);
  border: 1px solid rgba(128, 128, 128, 0.1);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.day-cell--out {
  opacity: 0.35;
}

.day-cell--today {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(0, 117, 255, 0.1);
}

.day-num {
  font-size: 12px;
  font-weight: 700;
}

.event-pill {
  font-size: 10.5px;
  font-weight: 700;
  color: white;
  padding: 2px 6px;
  border-radius: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-area {
  width: 100%;
  height: auto;
  overflow: visible;
}

@media (max-width: 600px) {
  .day-cell {
    min-height: 56px;
  }
  .event-pill {
    font-size: 0;
    padding: 3px;
    border-radius: 50%;
    width: 6px;
    height: 6px;
  }
}
</style>
