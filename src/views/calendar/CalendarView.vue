<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMonthGrid, WEEKDAYS } from '@/composables/useMonthGrid'
import { useEventBars } from '@/composables/useEventBars'
import { CAL_STATUS_META, TODAY, type CalEvent } from '@/mocks/calendar'
import { useCalendarStore } from '@/stores/calendar'
import { useAuthStore } from '@/stores/auth'
import { formatDay } from '@/utils/datetime'
import type { AppointmentSlotStatus } from '@/types/domain'

const { t } = useI18n()
const calendarStore = useCalendarStore()
const auth = useAuthStore()
const busy = ref(false)

calendarStore.load()

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
  return `${formatDay(e.date)}, ${e.time || t('calendar.allDay')}`
}

const legend = computed<{ status: AppointmentSlotStatus; label: string }[]>(() => [
  { status: 'booked', label: t('calendar.legendBooked') },
  { status: 'free', label: t('calendar.legendFree') },
  { status: 'cancelled', label: t('calendar.legendCancelled') },
])

// ---------------------------------------------------------------------------
// Voqea qo'shish / tahrirlash (psixolog uchun) — kun katakчasiga bosib
// yangi voqea, voqea-panjarasiga bosib mavjudini tahrirlash.
// ---------------------------------------------------------------------------
const dialog = ref(false)
const editingId = ref<string | null>(null)
const toast = ref('')
const toastOpen = ref(false)

const defaultDate = () => {
  const d = TODAY
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const form = ref<{ title: string; date: string; time: string; status: AppointmentSlotStatus }>({
  title: '',
  date: defaultDate(),
  time: '10:00',
  status: 'booked',
})
const statusOptions = computed<{ title: string; value: AppointmentSlotStatus }[]>(() => [
  { title: t('calendar.statusBooked'), value: 'booked' },
  { title: t('calendar.statusFree'), value: 'free' },
  { title: t('calendar.statusCancelled'), value: 'cancelled' },
])

/** Talaba faqat ko'radi — qo'shish/tahrirlash faqat xodim uchun. */
function openCreate(dateKey?: string) {
  if (!auth.isStaff) return
  editingId.value = null
  form.value = { title: '', date: dateKey ?? defaultDate(), time: '10:00', status: 'booked' }
  dialog.value = true
}

function openEdit(ev: CalEvent) {
  if (!auth.isStaff) return
  editingId.value = ev.id
  form.value = {
    title: ev.title,
    date: ev.date,
    time: ev.time,
    status: ev.status,
  }
  dialog.value = true
}

async function submitEvent() {
  if (!form.value.title.trim() || !form.value.date || busy.value) return
  busy.value = true
  const payload = {
    title: form.value.title.trim(),
    date: form.value.date,
    time: form.value.time,
    status: form.value.status,
  }
  try {
    if (editingId.value) {
      await calendarStore.updateEvent(editingId.value, payload)
      toast.value = t('calendar.eventUpdated')
    } else {
      await calendarStore.addEvent(payload)
      toast.value = t('calendar.eventAdded')
    }
    dialog.value = false
    toastOpen.value = true
  } catch {
    toast.value = t('calendar.saveError')
    toastOpen.value = true
  } finally {
    busy.value = false
  }
}

async function deleteEvent() {
  if (!editingId.value || busy.value) return
  busy.value = true
  try {
    await calendarStore.removeEvent(editingId.value)
    dialog.value = false
    toast.value = t('calendar.eventDeleted')
    toastOpen.value = true
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between page-head flex-wrap" style="gap: 12px">
      <div>
        <h1 class="text-h4">{{ t('calendar.title') }}</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          {{ auth.isStaff ? t('calendar.staffSubtitle', { name: auth.user?.hemis.fullName }) : t('calendar.studentSubtitle') }}
        </p>
      </div>
      <v-btn v-if="auth.isStaff" color="primary" prepend-icon="mdi-plus" @click="openCreate()">{{ t('calendar.addEvent') }}</v-btn>
    </div>

    <v-row>
      <v-col cols="12" lg="8">
        <v-card class="surface-card pa-4 pa-md-5" rounded="lg">
          <div class="d-flex align-center justify-space-between mb-4">
            <span class="text-h6 text-display font-weight-bold">{{ monthLabel }}</span>
            <div class="d-flex align-center" style="gap: 6px">
              <v-btn size="small" variant="tonal" @click="goToday">{{ t('calendar.today') }}</v-btn>
              <v-btn icon="mdi-chevron-left" size="small" variant="text" @click="prevMonth" />
              <v-btn icon="mdi-chevron-right" size="small" variant="text" @click="nextMonth" />
            </div>
          </div>

          <div class="d-flex flex-wrap align-center mb-3" style="gap: 14px">
            <span v-for="l in legend" :key="l.status" class="d-flex align-center text-caption text-medium-emphasis" style="gap: 6px">
              <span class="legend-dot" :style="{ background: CAL_STATUS_META[l.status].color }" />{{ l.label }}
            </span>
            <span v-if="auth.isStaff" class="text-caption text-medium-emphasis d-none d-sm-flex align-center" style="gap: 4px">
              <v-icon icon="mdi-gesture-tap" size="13" />{{ t('calendar.hint') }}
            </span>
          </div>

          <div class="weekday-row">
            <div v-for="d in WEEKDAYS" :key="d" class="weekday-label">{{ d }}</div>
          </div>

          <div v-for="(week, wi) in weeks" :key="wi" class="week-row">
            <div class="week-bg">
              <button
                v-for="cell in week" :key="cell.key"
                type="button"
                class="day-cell-bg"
                :class="{ 'day-cell-bg--out': !cell.inMonth, 'day-cell-bg--today': cell.isToday, 'day-cell-bg--readonly': !auth.isStaff }"
                :style="{ minHeight: `${34 + laneCounts[wi] * 26}px` }"
                :aria-label="auth.isStaff ? `${cell.date.getDate()} — ${t('calendar.addEvent')}` : String(cell.date.getDate())"
                @click="openCreate(cell.key)"
              >
                <span class="day-num">{{ cell.date.getDate() }}</span>
              </button>
            </div>
            <div class="week-bars" :style="{ gridTemplateRows: `repeat(${laneCounts[wi]}, 22px)` }">
              <button
                v-for="seg in bars[wi]" :key="seg.event.id"
                type="button"
                class="event-bar" :class="{ 'event-bar--readonly': !auth.isStaff }"
                :style="{
                  gridColumn: `${seg.startCol + 1} / span ${seg.span}`,
                  gridRow: seg.lane + 1,
                  background: CAL_STATUS_META[seg.event.status].color,
                }"
                :title="`${seg.event.title} — ${seg.event.time || t('calendar.allDay')}`"
                @click.stop="openEdit(seg.event)"
              >
                {{ seg.event.title }}
              </button>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="surface-card pa-4" rounded="lg">
          <div class="text-subtitle-1 font-weight-bold mb-3">{{ t('calendar.upcoming') }}</div>
          <button
            v-for="(e, i) in upcoming"
            :key="i"
            type="button"
            class="upcoming-row d-flex align-center w-100 py-2" :class="{ 'upcoming-row--readonly': !auth.isStaff }"
            style="gap: 12px"
            @click="openEdit(e)"
          >
            <div class="icon-tile" style="width: 36px; height: 36px" :style="{ '--tint': CAL_STATUS_META[e.status].color }">
              <v-icon :icon="CAL_STATUS_META[e.status].icon" size="17" />
            </div>
            <div class="text-left">
              <div class="text-body-2 font-weight-bold">{{ e.title }}</div>
              <div class="text-caption text-medium-emphasis">{{ formatUpcoming(e) }}</div>
            </div>
          </button>
          <v-empty-state v-if="!upcoming.length" icon="mdi-calendar-check-outline" :title="t('calendar.noUpcoming')" density="compact" />
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-if="auth.isStaff" v-model="dialog" max-width="440">
      <v-card class="surface-card pa-6" rounded="lg">
        <div class="d-flex align-center justify-space-between mb-4">
          <span class="text-subtitle-1 font-weight-bold">
            {{ editingId ? t('calendar.editEvent') : t('calendar.addEvent') }}
          </span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="dialog = false" />
        </div>
        <v-text-field v-model="form.title" :label="t('calendar.titleLabel')" density="comfortable" class="mb-1" autofocus />
        <v-row dense>
          <v-col cols="6">
            <v-text-field v-model="form.date" type="date" :label="t('calendar.dateLabel')" density="comfortable" />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="form.time" type="time" :label="t('calendar.timeLabel')" density="comfortable" />
          </v-col>
        </v-row>
        <v-select v-model="form.status" :items="statusOptions" item-title="title" item-value="value" :label="t('calendar.statusLabel')" density="comfortable" />
        <div class="d-flex align-center mt-3" style="gap: 8px">
          <v-btn
            v-if="editingId"
            variant="text"
            color="error"
            prepend-icon="mdi-delete-outline"
            :loading="busy"
            @click="deleteEvent"
          >
            {{ t('calendar.delete') }}
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">{{ t('calendar.cancel') }}</v-btn>
          <v-btn color="primary" variant="flat" :loading="busy" :disabled="!form.title.trim()" @click="submitEvent">
            {{ editingId ? t('calendar.save') : t('calendar.add') }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="toastOpen" location="top end" color="success" timeout="2500">{{ toast }}</v-snackbar>
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

.legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 3px;
  flex-shrink: 0;
}

.week-row {
  position: relative;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.week-row:last-child {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.week-bg {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.day-cell-bg {
  padding: 8px;
  border: none;
  border-right: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.6));
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: inherit;
  font: inherit;
  transition: background 0.12s var(--ease);
}
.day-cell-bg:hover {
  background: rgba(var(--v-theme-primary), 0.06);
}
.day-cell-bg:last-child {
  border-right: none;
}
.day-cell-bg--readonly {
  cursor: default;
}
.day-cell-bg--readonly:hover {
  background: transparent;
}

.day-cell-bg--out .day-num {
  opacity: 0.3;
}

.event-bar--readonly {
  cursor: default;
}

.upcoming-row {
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  border-radius: var(--radius-sm);
  transition: background 0.12s var(--ease);
}
.upcoming-row--readonly {
  cursor: default;
}
.upcoming-row:hover {
  background: rgba(var(--v-theme-primary), 0.06);
}
.upcoming-row--readonly:hover {
  background: none;
}

.day-cell-bg--today .day-num {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
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
  font-weight: 600;
  text-align: left;
  padding: 3px 8px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: filter 0.12s var(--ease);
}
.event-bar:hover {
  filter: brightness(1.06);
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
