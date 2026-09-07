<script setup lang="ts">
import { ref, computed } from 'vue'
import { TEMPERAMENT_COLORS, SHAPE_COLORS, SHAPE_ICONS } from '@/utils/instruments'
import type { FacultyStatsDto } from '@/types/domain'

// Placeholder — wired to GET /admin/result/fakulty once the backend exists
// (TZ §14). Shape matches the real endpoint's response exactly.
const faculties: FacultyStatsDto[] = [
  {
    departmentId: 'f1', departmentName: 'Xorijiy filologiya fakulteti', totalStudents: 412, studentsWithTests: 356, studentsWithoutTests: 56,
    singleTest: { studentsWithSingle: 340, totalStudents: 412, geometricFigures: [{ name: 'Kvadrat', count: 88 }, { name: 'Uchburchak', count: 61 }, { name: "To'g'ri to'rtburchak", count: 74 }, { name: 'Doira', count: 69 }, { name: 'Zigzag', count: 48 }] },
    multipleTest: { studentsWithMultiple: 330, totalStudents: 412, temperamentTypes: [{ name: 'Xolerik', count: 72 }, { name: 'Sangvinik', count: 101 }, { name: 'Flegmatik', count: 84 }, { name: 'Melanxolik', count: 73 }] },
    nevrastheniaTest: { studentsWithNevrasthenia: 298, studentsWithoutNevrasthenia: 114, scales: [] },
  },
  {
    departmentId: 'f2', departmentName: 'Tarix fakulteti', totalStudents: 268, studentsWithTests: 190, studentsWithoutTests: 78,
    singleTest: { studentsWithSingle: 180, totalStudents: 268, geometricFigures: [{ name: 'Kvadrat', count: 44 }, { name: 'Uchburchak', count: 39 }, { name: "To'g'ri to'rtburchak", count: 40 }, { name: 'Doira', count: 33 }, { name: 'Zigzag', count: 24 }] },
    multipleTest: { studentsWithMultiple: 175, totalStudents: 268, temperamentTypes: [{ name: 'Xolerik', count: 38 }, { name: 'Sangvinik', count: 52 }, { name: 'Flegmatik', count: 46 }, { name: 'Melanxolik', count: 39 }] },
    nevrastheniaTest: { studentsWithNevrasthenia: 150, studentsWithoutNevrasthenia: 118, scales: [] },
  },
  {
    departmentId: 'f3', departmentName: 'Jurnalistika fakulteti', totalStudents: 190, studentsWithTests: 132, studentsWithoutTests: 58,
    singleTest: { studentsWithSingle: 125, totalStudents: 190, geometricFigures: [{ name: 'Kvadrat', count: 30 }, { name: 'Uchburchak', count: 26 }, { name: "To'g'ri to'rtburchak", count: 28 }, { name: 'Doira', count: 25 }, { name: 'Zigzag', count: 16 }] },
    multipleTest: { studentsWithMultiple: 120, totalStudents: 190, temperamentTypes: [{ name: 'Xolerik', count: 24 }, { name: 'Sangvinik', count: 36 }, { name: 'Flegmatik', count: 32 }, { name: 'Melanxolik', count: 28 }] },
    nevrastheniaTest: { studentsWithNevrasthenia: 101, studentsWithoutNevrasthenia: 89, scales: [] },
  },
]

const totals = computed(() => {
  const totalStudents = faculties.reduce((s, f) => s + f.totalStudents, 0)
  const withTests = faculties.reduce((s, f) => s + f.studentsWithTests, 0)
  const withoutTests = totalStudents - withTests
  const pct = totalStudents ? Math.round((withTests / totalStudents) * 100) : 0

  const figureMap = new Map<string, number>()
  const tempMap = new Map<string, number>()
  faculties.forEach((f) => {
    f.singleTest.geometricFigures.forEach((g) => figureMap.set(g.name, (figureMap.get(g.name) ?? 0) + g.count))
    f.multipleTest.temperamentTypes.forEach((t) => tempMap.set(t.name, (tempMap.get(t.name) ?? 0) + t.count))
  })
  const withNevrasthenia = faculties.reduce((s, f) => s + f.nevrastheniaTest.studentsWithNevrasthenia, 0)
  const withoutNevrasthenia = faculties.reduce((s, f) => s + f.nevrastheniaTest.studentsWithoutNevrasthenia, 0)

  return {
    totalStudents, withTests, withoutTests, pct,
    figures: Array.from(figureMap, ([name, count]) => ({ name, count })),
    temperaments: Array.from(tempMap, ([name, count]) => ({ name, count })),
    withNevrasthenia, withoutNevrasthenia,
  }
})

const openFaculties = ref<Record<string, boolean>>({})
function toggle(id: string) {
  openFaculties.value[id] = !openFaculties.value[id]
}

const statCards = computed(() => [
  { label: 'Jami talabalar', value: totals.value.totalStudents, icon: 'mdi-account-group-outline', tint: 'rgb(var(--v-theme-primary))' },
  { label: 'Test topshirgan', value: totals.value.withTests, icon: 'mdi-check-circle-outline', tint: 'rgb(var(--v-theme-success))' },
  { label: 'Test topshirmagan', value: totals.value.withoutTests, icon: 'mdi-account-alert-outline', tint: 'rgb(var(--v-theme-warning))' },
  { label: 'Yakunlanish foizi', value: `${totals.value.pct}%`, icon: 'mdi-chart-arc', tint: 'rgb(var(--v-theme-secondary))' },
])

function figureColor(name: string) {
  return SHAPE_COLORS[name] ?? '#8892A6'
}
function tempColor(name: string) {
  return TEMPERAMENT_COLORS[name] ?? '#8892A6'
}
function maxOf(list: { count: number }[]) {
  return Math.max(1, ...list.map((x) => x.count))
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between flex-wrap mb-1" style="gap: 12px">
      <div>
        <h1 class="text-display text-h4 font-weight-bold mb-1">Statistika</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">Universitet va fakultetlar kesimida test qamrovi.</p>
      </div>
      <v-btn variant="tonal" color="secondary" prepend-icon="mdi-refresh" class="text-none">Yangilash</v-btn>
    </div>

    <v-row class="mt-4">
      <v-col v-for="s in statCards" :key="s.label" cols="12" sm="6" md="3">
        <v-card class="pa-4 surface-card h-100" rounded="lg">
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-caption text-medium-emphasis">{{ s.label }}</span>
            <div class="icon-tile" :style="{ '--tint': s.tint }"><v-icon :icon="s.icon" size="20" /></div>
          </div>
          <div class="text-h4 text-display font-weight-bold">{{ s.value }}</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-1">
      <v-col cols="12" md="4">
        <v-card class="surface-card pa-5 h-100" rounded="lg">
          <div class="text-subtitle-1 font-weight-bold mb-4">Psixogeometrik (universitet bo‘yicha)</div>
          <div v-for="f in totals.figures" :key="f.name" class="mb-3">
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="d-flex align-center text-body-2 font-weight-600" style="gap: 6px">
                <v-icon :icon="SHAPE_ICONS[f.name]" size="15" :color="figureColor(f.name)" />{{ f.name }}
              </span>
              <span class="text-caption text-medium-emphasis">{{ f.count }}</span>
            </div>
            <v-progress-linear :model-value="(f.count / maxOf(totals.figures)) * 100" height="6" rounded :color="figureColor(f.name)" bg-color="surface-variant" />
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="surface-card pa-5 h-100" rounded="lg">
          <div class="text-subtitle-1 font-weight-bold mb-4">Temperament (universitet bo‘yicha)</div>
          <div v-for="t in totals.temperaments" :key="t.name" class="mb-3">
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="text-body-2 font-weight-600">{{ t.name }}</span>
              <span class="text-caption text-medium-emphasis">{{ t.count }}</span>
            </div>
            <v-progress-linear :model-value="(t.count / maxOf(totals.temperaments)) * 100" height="6" rounded :color="tempColor(t.name)" bg-color="surface-variant" />
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="surface-card pa-5 h-100" rounded="lg">
          <div class="text-subtitle-1 font-weight-bold mb-4">Nevrasteniya (universitet bo‘yicha)</div>
          <div class="d-flex align-center justify-space-between mb-3">
            <v-chip color="success" variant="tonal" prepend-icon="mdi-check">{{ totals.withNevrasthenia }} ta xulosa bor</v-chip>
          </div>
          <div class="d-flex align-center justify-space-between">
            <v-chip color="warning" variant="tonal" prepend-icon="mdi-close">{{ totals.withoutNevrasthenia }} ta xulosa yo‘q</v-chip>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <div class="text-subtitle-1 font-weight-bold mt-6 mb-3">Fakultetlar kesimida</div>
    <v-card v-for="f in faculties" :key="f.departmentId" class="surface-card mb-3" rounded="lg">
      <button class="faculty-header w-100 d-flex align-center justify-space-between pa-4" @click="toggle(f.departmentId)">
        <span class="text-body-1 font-weight-bold">{{ f.departmentName }}</span>
        <div class="d-flex align-center" style="gap: 10px">
          <v-chip size="small" variant="tonal" color="primary">{{ f.totalStudents }} jami</v-chip>
          <v-chip size="small" variant="tonal" color="success">{{ f.studentsWithTests }} topshirgan</v-chip>
          <v-icon :icon="openFaculties[f.departmentId] ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
        </div>
      </button>
      <v-expand-transition>
        <div v-if="openFaculties[f.departmentId]" class="px-4 pb-4">
          <v-divider opacity="0.1" class="mb-4" />
          <v-row>
            <v-col cols="12" md="6">
              <div class="text-caption text-medium-emphasis text-uppercase mb-2">Psixogeometrik</div>
              <div v-for="g in f.singleTest.geometricFigures" :key="g.name" class="mb-2">
                <div class="d-flex justify-space-between text-caption mb-1"><span>{{ g.name }}</span><span>{{ g.count }}</span></div>
                <v-progress-linear :model-value="(g.count / maxOf(f.singleTest.geometricFigures)) * 100" height="5" rounded :color="figureColor(g.name)" bg-color="surface-variant" />
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption text-medium-emphasis text-uppercase mb-2">Temperament</div>
              <div v-for="t in f.multipleTest.temperamentTypes" :key="t.name" class="mb-2">
                <div class="d-flex justify-space-between text-caption mb-1"><span>{{ t.name }}</span><span>{{ t.count }}</span></div>
                <v-progress-linear :model-value="(t.count / maxOf(f.multipleTest.temperamentTypes)) * 100" height="5" rounded :color="tempColor(t.name)" bg-color="surface-variant" />
              </div>
            </v-col>
          </v-row>
        </div>
      </v-expand-transition>
    </v-card>
  </div>
</template>

<style scoped>
.faculty-header {
  background: transparent;
  border: none;
  cursor: pointer;
  color: inherit;
  border-radius: 20px;
}
</style>
