<script setup lang="ts">
import { computed } from 'vue'
import { useMonthGrid, WEEKDAYS } from '@/composables/useMonthGrid'
import { CAL_EVENTS, CAL_STATUS_META, TODAY } from '@/mocks/calendar'

const { monthLabel, weeks, prevMonth, nextMonth } = useMonthGrid(CAL_EVENTS, TODAY)

const todayEvents = computed(() => CAL_EVENTS.filter((e) => e.date === weeks.value.flat().find((c) => c.isToday)?.key))
</script>

<template>
  <v-card class="surface-glass h-100 pa-4 pa-md-5" rounded="xl">
    <div class="d-flex align-center justify-space-between mb-3">
      <span class="text-subtitle-1 font-weight-800">{{ monthLabel }}</span>
      <div class="d-flex align-center" style="gap: 2px">
        <v-btn icon="mdi-chevron-left" size="x-small" variant="text" @click="prevMonth" />
        <v-btn icon="mdi-chevron-right" size="x-small" variant="text" @click="nextMonth" />
        <v-btn icon="mdi-arrow-right" size="x-small" variant="text" color="secondary" to="/calendar" />
      </div>
    </div>

    <div class="mini-grid">
      <div v-for="d in WEEKDAYS" :key="d" class="mini-weekday">{{ d[0] }}</div>
      <template v-for="(week, wi) in weeks" :key="wi">
        <div
          v-for="cell in week" :key="cell.key"
          class="mini-day" :class="{ 'mini-day--out': !cell.inMonth, 'mini-day--today': cell.isToday }"
        >
          <span>{{ cell.date.getDate() }}</span>
          <div class="mini-dots">
            <span
              v-for="(ev, ei) in cell.events.slice(0, 3)" :key="ei"
              class="mini-dot" :style="{ background: CAL_STATUS_META[ev.status].color }"
            />
          </div>
        </div>
      </template>
    </div>

    <v-divider opacity="0.1" class="my-3" />

    <div class="text-caption font-weight-700 text-medium-emphasis text-uppercase mb-2">Bugun</div>
    <div v-if="todayEvents.length" class="d-flex flex-column" style="gap: 6px">
      <div v-for="(e, i) in todayEvents.slice(0, 2)" :key="i" class="d-flex align-center" style="gap: 8px">
        <span class="mini-dot" :style="{ background: CAL_STATUS_META[e.status].color }" />
        <span class="text-caption font-weight-600">{{ e.time }} · {{ e.title }}</span>
      </div>
    </div>
    <div v-else class="text-caption text-medium-emphasis">Rejalashtirilgan qabul yo‘q</div>
  </v-card>
</template>

<style scoped>
.mini-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 2px;
}

.mini-weekday {
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  opacity: 0.5;
  padding-bottom: 4px;
}

.mini-day {
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  gap: 2px;
}

.mini-day--out {
  opacity: 0.3;
}

.mini-day--today {
  background: var(--gradient-accent);
  color: #fff;
  font-weight: 800;
}

.mini-dots {
  display: flex;
  gap: 2px;
  height: 4px;
}

.mini-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
