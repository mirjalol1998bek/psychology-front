<script setup lang="ts">
import type { AppointmentSlotDto } from '@/types/domain'

// Placeholder week — wired to the psychologist's real slot list later (TZ §9).
const days = [
  { date: '2026-09-07', label: '7-sen, Du' },
  { date: '2026-09-08', label: '8-sen, Se' },
  { date: '2026-09-09', label: '9-sen, Ch' },
  { date: '2026-09-10', label: '10-sen, Pa' },
  { date: '2026-09-11', label: '11-sen, Ju' },
]

const slots: AppointmentSlotDto[] = [
  { id: 's1', date: '2026-09-07', startTime: '09:00', endTime: '09:30', status: 'free' },
  { id: 's2', date: '2026-09-07', startTime: '09:30', endTime: '10:00', status: 'booked', studentName: 'A. Karimov' },
  { id: 's3', date: '2026-09-09', startTime: '10:00', endTime: '10:30', status: 'booked', studentName: 'Siz' },
  { id: 's4', date: '2026-09-09', startTime: '10:30', endTime: '11:00', status: 'free' },
  { id: 's5', date: '2026-09-10', startTime: '11:00', endTime: '11:30', status: 'free' },
  { id: 's6', date: '2026-09-11', startTime: '14:00', endTime: '14:30', status: 'cancelled' },
]

function slotsFor(date: string) {
  return slots.filter((s) => s.date === date)
}

const statusMeta = {
  free: { color: 'success', icon: 'mdi-calendar-plus-outline', label: 'Bo‘sh' },
  booked: { color: 'primary', icon: 'mdi-account-check-outline', label: 'Band' },
  cancelled: { color: 'error', icon: 'mdi-calendar-remove-outline', label: 'Bekor qilingan' },
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-1 flex-wrap" style="gap: 12px">
      <div>
        <h1 class="text-display text-h4 font-weight-600 mb-1">Qabul kalendari</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">Psixolog Nilufar Egamova — haftalik jadval</p>
      </div>
      <v-btn color="primary" class="text-none" prepend-icon="mdi-calendar-plus">Yozilish</v-btn>
    </div>

    <div class="week-grid mt-4">
      <v-card v-for="day in days" :key="day.date" elevation="1" class="pa-3 h-100">
        <div class="text-caption font-weight-700 text-medium-emphasis text-uppercase mb-3">{{ day.label }}</div>
        <div class="d-flex flex-column" style="gap: 8px">
          <v-sheet
            v-for="slot in slotsFor(day.date)"
            :key="slot.id"
            rounded="lg"
            class="pa-2 d-flex align-center"
            :style="{
              gap: '8px',
              background: `rgba(var(--v-theme-${statusMeta[slot.status].color}), 0.1)`,
              border: `1px solid rgb(var(--v-theme-${statusMeta[slot.status].color}))`,
            }"
          >
            <v-icon :icon="statusMeta[slot.status].icon" :color="statusMeta[slot.status].color" size="18" />
            <div>
              <div class="text-caption font-weight-700">{{ slot.startTime }}–{{ slot.endTime }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ slot.studentName ?? statusMeta[slot.status].label }}
              </div>
            </div>
          </v-sheet>
          <div v-if="!slotsFor(day.date).length" class="text-caption text-medium-emphasis">Slot yo‘q</div>
        </div>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.week-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 960px) {
  .week-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .week-grid {
    grid-template-columns: 1fr;
  }
}
</style>
