<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMonthGrid, WEEKDAYS, MONTH_NAMES } from '@/composables/useMonthGrid'
import { useEventBars } from '@/composables/useEventBars'
import { CAL_STATUS_META, TODAY, type CalEvent } from '@/mocks/calendar'
import { useCalendarStore } from '@/stores/calendar'
import type { AppointmentSlotStatus } from '@/types/domain'

const calendarStore = useCalendarStore()

const { monthLabel, weeks, prevMonth, nextMonth, goToday } = useMonthGrid(calendarStore.events, TODAY)
const bars = useEventBars(weeks, computed(() => calendarStore.events))

// Each week row needs enough height for however many lanes of bars it holds.
const laneCounts = computed(() => bars.value.map((week) => Math.max(1, ...week.map((b) => b.lane + 1))))

const upcoming = computed(() =>
  calendarStore.events
    .filter((e) => new Date(e.date) >= TODAY && e.status !== 'cancelled')
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

// ---------------------------------------------------------------------------
// Voqea qo'shish (psixolog uchun)
// ---------------------------------------------------------------------------
const addDialog = ref(false)
const form = ref<{ title: string; date: string; endDate: string; time: string; status: AppointmentSlotStatus }>({
  title: '',
  date: '2026-09-04',
  endDate: '',
  time: '10:00',
  status: 'booked',
})
const statusOptions: { title: string; value: AppointmentSlotStatus }[] = [
  { title: 'Band', value: 'booked' },
  { title: 'Bo‘sh', value: 'free' },
  { title: 'Bekor qilingan', value: 'cancelled' },
]
const toastOpen = ref(false)

function submitEvent() {
  if (!form.value.title.trim() || !form.value.date) return
  calendarStore.addEvent({
    title: form.value.title.trim(),
    date: form.value.date,
    endDate: form.value.endDate || undefined,
    time: form.value.time || 'Kun bo‘yi',
    status: form.value.status,
  })
  addDialog.value = false
  toastOpen.value = true
  form.value = { title: '', date: form.value.date, endDate: '', time: '10:00', status: 'booked' }
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap" style="gap: 12px">
      <div>
        <h1 class="text-display text-h4 font-weight-800 mb-1">Qabul kalendari</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">Psixolog Nilufar Egamova — oylik jadval</p>
      </div>
      <v-btn color="primary" class="text-none" prepend-icon="mdi-plus" rounded="xl" @click="addDialog = true">
        Voqea qo‘shish
      </v-btn>
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

          <div class="weekday-row">
            <div v-for="d in WEEKDAYS" :key="d" class="weekday-label">{{ d }}</div>
          </div>

          <div v-for="(week, wi) in weeks" :key="wi" class="week-row">
            <div class="week-bg">
              <div
                v-for="cell in week" :key="cell.key"
                class="day-cell-bg" :class="{ 'day-cell-bg--out': !cell.inMonth, 'day-cell-bg--today': cell.isToday }"
                :style="{ minHeight: `${34 + laneCounts[wi] * 26}px` }"
              >
                <span class="day-num">{{ cell.date.getDate() }}</span>
              </div>
            </div>
            <div class="week-bars" :style="{ gridTemplateRows: `repeat(${laneCounts[wi]}, 22px)` }">
              <button
                v-for="seg in bars[wi]" :key="seg.event.id"
                class="event-bar"
                :style="{
                  gridColumn: `${seg.startCol + 1} / span ${seg.span}`,
                  gridRow: seg.lane + 1,
                  background: CAL_STATUS_META[seg.event.status].color,
                }"
                :title="`${seg.event.title} — ${seg.event.time}`"
              >
                {{ seg.event.title }}
              </button>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="surface-glass pa-4 mb-4" rounded="xl">
          <div class="text-subtitle-1 font-weight-700 mb-3">Yaqin qabullar</div>
          <div v-for="(e, i) in upcoming" :key="i" class="d-flex align-center py-2" style="gap: 12px">
            <div class="icon-badge" style="width: 36px; height: 36px; border-radius: 10px" :style="{ background: `${CAL_STATUS_META[e.status].color}26` }">
              <v-icon :icon="CAL_STATUS_META[e.status].icon" :color="e.status === 'free' ? 'success' : 'primary'" size="17" />
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

    <v-dialog v-model="addDialog" max-width="420">
      <v-card class="surface-glass pa-6" rounded="xl">
        <div class="text-subtitle-1 font-weight-700 mb-4">Voqea qo‘shish</div>
        <v-text-field v-model="form.title" label="Sarlavha" density="comfortable" class="mb-1" />
        <v-row dense>
          <v-col cols="6">
            <v-text-field v-model="form.date" type="date" label="Sana" density="comfortable" />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="form.endDate" type="date" label="Tugash (ixtiyoriy)" density="comfortable" />
          </v-col>
        </v-row>
        <v-text-field v-model="form.time" label="Vaqt (masalan 10:00)" density="comfortable" />
        <v-select v-model="form.status" :items="statusOptions" item-title="title" item-value="value" label="Holat" density="comfortable" />
        <div class="d-flex justify-end mt-3" style="gap: 8px">
          <v-btn variant="text" class="text-none" @click="addDialog = false">Bekor qilish</v-btn>
          <v-btn color="primary" variant="flat" class="text-none" @click="submitEvent">Qo‘shish</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="toastOpen" location="top end" color="success" timeout="2500">Voqea qo‘shildi</v-snackbar>
  </div>
</template>

<style scoped>
.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  margin-bottom: 4px;
}

.weekday-label {
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.5;
  padding-bottom: 8px;
}

.week-row {
  position: relative;
  border-top: 1px solid rgba(128, 128, 128, 0.1);
}
.week-row:last-child {
  border-bottom: 1px solid rgba(128, 128, 128, 0.1);
}

.week-bg {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.day-cell-bg {
  padding: 8px;
  border-right: 1px solid rgba(128, 128, 128, 0.07);
}
.day-cell-bg:last-child {
  border-right: none;
}

.day-cell-bg--out .day-num {
  opacity: 0.3;
}

.day-cell-bg--today .day-num {
  background: var(--gradient-accent);
  color: #fff;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.day-num {
  font-size: 12.5px;
  font-weight: 700;
}

.week-bars {
  position: absolute;
  left: 0;
  right: 0;
  top: 30px;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 3px 6px;
  padding: 0 4px;
  pointer-events: none;
}

.event-bar {
  pointer-events: auto;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  text-align: left;
  padding: 3px 8px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
  box-shadow: 0 2px 6px -1px rgba(0, 0, 0, 0.35);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.event-bar:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px -1px rgba(0, 0, 0, 0.45);
}

.mini-area {
  width: 100%;
  height: auto;
  overflow: visible;
}

@media (max-width: 700px) {
  .weekday-label {
    font-size: 9px;
  }
  .event-bar {
    font-size: 0;
    padding: 3px;
  }
}
</style>
