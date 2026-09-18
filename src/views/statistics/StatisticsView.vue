<script setup lang="ts">
import { ref, computed } from 'vue'
import { TEMPERAMENT_COLORS, SHAPE_COLORS, SHAPE_ICONS, INSTRUMENT_META, instrumentLabel } from '@/utils/instruments'
import { instrumentForAlgo, isRenderableAlgo } from '@/services/quizService'
import { api } from '@/services/apiClient'

interface Pair {
  key: string
  count: number
}
interface ScaleStat {
  algo: string
  withResult: number
  withoutResult: number
}
interface FacultyStat {
  id: number
  name: string
  students: number
  withResults: number
  figures: Pair[]
  temperaments: Pair[]
  scales: ScaleStat[]
}
interface Overview {
  totals: { students: number; withResults: number }
  faculties: FacultyStat[]
}

/** Backend algo (masalan SCORE_SCALE_EMOTIONAL) → shu metodikaning ko'rinadigan
 *  nomi. Frontendga hali ulanmagan algo bo'lsa (yangi metodika bor, lekin
 *  hali INSTRUMENT_META'da yo'q) — noto'g'ri nom ko'rsatmaslik uchun xom
 *  algo qatorining o'zi ko'rsatiladi. */
function scaleLabel(algo: string): string {
  return isRenderableAlgo(algo) ? instrumentLabel(instrumentForAlgo(algo)) : algo
}
function scaleMeta(algo: string) {
  return isRenderableAlgo(algo)
    ? INSTRUMENT_META[instrumentForAlgo(algo)]
    : { icon: 'mdi-gauge', tint: 'rgb(var(--v-theme-secondary))' }
}

const data = ref<Overview>({ totals: { students: 0, withResults: 0 }, faculties: [] })
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    data.value = (await api.get('/admin/statistics')).data as Overview
  } finally {
    loading.value = false
  }
}
load()

const totals = computed(() => {
  const totalStudents = data.value.totals.students
  const withTests = data.value.totals.withResults
  const withoutTests = Math.max(0, totalStudents - withTests)
  const pct = totalStudents ? Math.round((withTests / totalStudents) * 100) : 0

  const figureMap = new Map<string, number>()
  const tempMap = new Map<string, number>()
  const scaleMap = new Map<string, { withResult: number; withoutResult: number }>()
  data.value.faculties.forEach((f) => {
    f.figures.forEach((g) => figureMap.set(g.key, (figureMap.get(g.key) ?? 0) + g.count))
    f.temperaments.forEach((t) => tempMap.set(t.key, (tempMap.get(t.key) ?? 0) + t.count))
    f.scales.forEach((s) => {
      const cur = scaleMap.get(s.algo) ?? { withResult: 0, withoutResult: 0 }
      cur.withResult += s.withResult
      cur.withoutResult += s.withoutResult
      scaleMap.set(s.algo, cur)
    })
  })

  return {
    totalStudents,
    withTests,
    withoutTests,
    pct,
    figures: Array.from(figureMap, ([name, count]) => ({ name, count })),
    temperaments: Array.from(tempMap, ([name, count]) => ({ name, count })),
    scales: Array.from(scaleMap, ([algo, v]) => ({ algo, ...v })),
  }
})

const openFaculties = ref<Record<string, boolean>>({})
function toggle(id: number) {
  openFaculties.value[id] = !openFaculties.value[id]
}

const statCards = computed(() => [
  { label: 'Jami talabalar', value: totals.value.totalStudents, icon: 'mdi-account-group-outline', tint: 'rgb(var(--v-theme-primary))' },
  { label: 'Test topshirgan', value: totals.value.withTests, icon: 'mdi-check-circle-outline', tint: 'rgb(var(--v-theme-success))' },
  { label: 'Test topshirmagan', value: totals.value.withoutTests, icon: 'mdi-account-alert-outline', tint: 'rgb(var(--v-theme-warning))' },
  { label: 'Yakunlanish foizi', value: `${totals.value.pct}%`, icon: 'mdi-chart-arc', tint: 'rgb(var(--v-theme-secondary))' },
])

function figureColor(name: string) {
  return SHAPE_COLORS[name] ?? '#8C8678'
}
function tempColor(name: string) {
  return TEMPERAMENT_COLORS[name] ?? '#8C8678'
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
      <v-btn variant="tonal" color="secondary" prepend-icon="mdi-refresh" class="text-none" :loading="loading" @click="load">Yangilash</v-btn>
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
          <div v-if="!totals.figures.length" class="text-caption text-medium-emphasis">Hali natija yo‘q</div>
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
          <div v-if="!totals.temperaments.length" class="text-caption text-medium-emphasis">Hali natija yo‘q</div>
        </v-card>
      </v-col>

      <v-col v-for="s in totals.scales" :key="s.algo" cols="12" sm="6" md="4">
        <v-card class="surface-card pa-5 h-100" rounded="lg">
          <div class="d-flex align-center mb-4" style="gap: 10px">
            <div class="icon-tile" :style="{ '--tint': scaleMeta(s.algo).tint }"><v-icon :icon="scaleMeta(s.algo).icon" size="18" /></div>
            <div class="text-subtitle-1 font-weight-bold">{{ scaleLabel(s.algo) }} (universitet bo‘yicha)</div>
          </div>
          <div class="d-flex align-center justify-space-between mb-3">
            <v-chip color="success" variant="tonal" prepend-icon="mdi-check">{{ s.withResult }} ta natija bor</v-chip>
          </div>
          <div class="d-flex align-center justify-space-between">
            <v-chip color="warning" variant="tonal" prepend-icon="mdi-close">{{ s.withoutResult }} ta natija yo‘q</v-chip>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <div class="text-subtitle-1 font-weight-bold mt-6 mb-3">Fakultetlar kesimida</div>
    <v-card v-for="f in data.faculties" :key="f.id" class="surface-card mb-3" rounded="lg">
      <button class="faculty-header w-100 d-flex align-center justify-space-between pa-4" @click="toggle(f.id)">
        <span class="text-body-1 font-weight-bold">{{ f.name }}</span>
        <div class="d-flex align-center" style="gap: 10px">
          <v-chip size="small" variant="tonal" color="primary">{{ f.students }} jami</v-chip>
          <v-chip size="small" variant="tonal" color="success">{{ f.withResults }} topshirgan</v-chip>
          <v-icon :icon="openFaculties[f.id] ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
        </div>
      </button>
      <v-expand-transition>
        <div v-if="openFaculties[f.id]" class="px-4 pb-4">
          <v-divider opacity="0.1" class="mb-4" />
          <v-row>
            <v-col cols="12" md="4">
              <div class="text-caption text-medium-emphasis text-uppercase mb-2">Psixogeometrik</div>
              <div v-for="g in f.figures" :key="g.key" class="mb-2">
                <div class="d-flex justify-space-between text-caption mb-1"><span>{{ g.key }}</span><span>{{ g.count }}</span></div>
                <v-progress-linear :model-value="(g.count / maxOf(f.figures)) * 100" height="5" rounded :color="figureColor(g.key)" bg-color="surface-variant" />
              </div>
              <div v-if="!f.figures.length" class="text-caption text-medium-emphasis">—</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="text-caption text-medium-emphasis text-uppercase mb-2">Temperament</div>
              <div v-for="t in f.temperaments" :key="t.key" class="mb-2">
                <div class="d-flex justify-space-between text-caption mb-1"><span>{{ t.key }}</span><span>{{ t.count }}</span></div>
                <v-progress-linear :model-value="(t.count / maxOf(f.temperaments)) * 100" height="5" rounded :color="tempColor(t.key)" bg-color="surface-variant" />
              </div>
              <div v-if="!f.temperaments.length" class="text-caption text-medium-emphasis">—</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="text-caption text-medium-emphasis text-uppercase mb-2">Ball shkalalari</div>
              <div v-for="s in f.scales" :key="s.algo" class="d-flex justify-space-between text-caption mb-2">
                <span>{{ scaleLabel(s.algo) }}</span>
                <span>{{ s.withResult }}</span>
              </div>
              <div v-if="!f.scales.length" class="text-caption text-medium-emphasis">—</div>
            </v-col>
          </v-row>
        </div>
      </v-expand-transition>
    </v-card>
    <v-empty-state v-if="!loading && !data.faculties.length" icon="mdi-chart-box-outline" title="Ma’lumot yo‘q" density="compact" />
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
