<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  TEMPERAMENT_COLORS,
  TEMPERAMENT_ICONS,
  TEMPERAMENT_OPTIONS,
  SHAPE_COLORS,
  SHAPE_ICONS,
  SHAPE_OPTIONS,
  INSTRUMENT_META,
  instrumentLabel,
} from '@/utils/instruments'
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
interface DistItem {
  key: string
  label: string
  count: number
  pct: number
  color: string
  icon: string
}
interface DistSection {
  key: string
  title: string
  icon: string
  tint: string
  unit: string
  total: number
  items: DistItem[]
}

const FALLBACK_COLOR = '#8C8678'

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

function sumPairs(lists: Pair[][]): Map<string, number> {
  const map = new Map<string, number>()
  lists.flat().forEach((p) => map.set(p.key, (map.get(p.key) ?? 0) + p.count))
  return map
}

const totals = computed(() => {
  const totalStudents = data.value.totals.students
  const withTests = data.value.totals.withResults
  const scaleMap = new Map<string, number>()
  data.value.faculties.forEach((f) =>
    f.scales.forEach((s) => scaleMap.set(s.algo, (scaleMap.get(s.algo) ?? 0) + s.withResult)),
  )

  return {
    totalStudents,
    withTests,
    withoutTests: Math.max(0, totalStudents - withTests),
    pct: totalStudents ? Math.round((withTests / totalStudents) * 100) : 0,
    figures: sumPairs(data.value.faculties.map((f) => f.figures)),
    temperaments: sumPairs(data.value.faculties.map((f) => f.temperaments)),
    scales: Array.from(scaleMap, ([algo, withResult]) => ({ algo, withResult })),
  }
})

/** Taqsimot: har bir ma'lum toifa (0 bo'lsa ham) + ulushi, ko'pdan kamga. */
function buildDist(
  counts: Map<string, number>,
  options: string[],
  colors: Record<string, string>,
  icons: Record<string, string>,
): { total: number; items: DistItem[] } {
  const merged = new Map(counts)
  options.forEach((o) => merged.set(o, merged.get(o) ?? 0))
  const total = [...merged.values()].reduce((a, b) => a + b, 0)
  const items = [...merged]
    .map(([key, count]) => ({
      key,
      label: key,
      count,
      pct: total ? (count / total) * 100 : 0,
      color: colors[key] ?? FALLBACK_COLOR,
      icon: icons[key] ?? 'mdi-help-circle-outline',
    }))
    .sort((a, b) => b.count - a.count)

  return { total, items }
}

const distSections = computed<DistSection[]>(() => [
  {
    key: 'figures',
    title: 'Butun universitet bo‘yicha psixogeometrik test natijalari',
    icon: INSTRUMENT_META.RANKING_BASED.icon,
    tint: INSTRUMENT_META.RANKING_BASED.tint,
    unit: 'talaba',
    ...buildDist(totals.value.figures, SHAPE_OPTIONS, SHAPE_COLORS, SHAPE_ICONS),
  },
  {
    key: 'temperaments',
    title: 'Butun universitet bo‘yicha temperament test natijalari',
    icon: INSTRUMENT_META.FREQUENCY_BASED.icon,
    tint: INSTRUMENT_META.FREQUENCY_BASED.tint,
    unit: 'natija',
    ...buildDist(totals.value.temperaments, TEMPERAMENT_OPTIONS, TEMPERAMENT_COLORS, TEMPERAMENT_ICONS),
  },
])

/** Ball shkalali metodikalar: nechta talaba topshirgan — jami talabalarga nisbatan. */
const scaleItems = computed<DistItem[]>(() =>
  totals.value.scales.map((s) => ({
    key: s.algo,
    label: scaleLabel(s.algo),
    count: s.withResult,
    pct: totals.value.totalStudents ? (s.withResult / totals.value.totalStudents) * 100 : 0,
    color: scaleMeta(s.algo).tint,
    icon: scaleMeta(s.algo).icon,
  })),
)

const statCards = computed(() => [
  { label: 'Jami talabalar', value: totals.value.totalStudents, icon: 'mdi-account-group-outline', tint: 'rgb(var(--v-theme-primary))' },
  { label: 'Test topshirgan', value: totals.value.withTests, icon: 'mdi-check-circle-outline', tint: 'rgb(var(--v-theme-success))' },
  { label: 'Test topshirmagan', value: totals.value.withoutTests, icon: 'mdi-account-alert-outline', tint: 'rgb(var(--v-theme-warning))' },
  { label: 'Yakunlanish foizi', value: `${totals.value.pct}%`, icon: 'mdi-chart-arc', tint: 'rgb(var(--v-theme-secondary))' },
])

const openFaculties = ref<Record<string, boolean>>({})
function toggle(id: number) {
  openFaculties.value[id] = !openFaculties.value[id]
}

function facultyPct(f: FacultyStat) {
  return f.students ? Math.round((f.withResults / f.students) * 100) : 0
}
function figureColor(name: string) {
  return SHAPE_COLORS[name] ?? FALLBACK_COLOR
}
function tempColor(name: string) {
  return TEMPERAMENT_COLORS[name] ?? FALLBACK_COLOR
}
function maxOf(list: { count: number }[]) {
  return Math.max(1, ...list.map((x) => x.count))
}
function fmtPct(pct: number) {
  return `${pct.toFixed(1)}%`
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
          <div class="stat-value text-display" :style="{ color: s.tint }">{{ s.value }}</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Psixogeometrik / Temperament taqsimoti -->
    <section v-for="s in distSections" :key="s.key" class="dist-section mt-6" :style="{ '--tint': s.tint }">
      <header class="dist-head">
        <div class="dist-head-icon"><v-icon :icon="s.icon" size="20" /></div>
        <span class="dist-head-title">{{ s.title }}</span>
        <span class="dist-badge">{{ s.total }} ta {{ s.unit }}</span>
      </header>

      <div class="dist-grid">
        <div v-for="it in s.items" :key="it.key" class="dist-card" :style="{ '--c': it.color }">
          <div class="dist-icon"><v-icon :icon="it.icon" size="26" /></div>
          <div class="dist-label">{{ it.label }}</div>
          <div class="dist-count text-display">{{ it.count }}</div>
          <div class="dist-unit text-medium-emphasis">{{ s.unit }}</div>
          <div class="dist-bar-row">
            <div class="dist-bar"><div class="dist-bar-fill" :style="{ width: `${it.pct}%` }" /></div>
            <span class="dist-pct">{{ fmtPct(it.pct) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Ball shkalali metodikalar qamrovi -->
    <section v-if="scaleItems.length" class="dist-section mt-6" style="--tint: rgb(var(--v-theme-secondary))">
      <header class="dist-head">
        <div class="dist-head-icon"><v-icon icon="mdi-clipboard-pulse-outline" size="20" /></div>
        <span class="dist-head-title">Boshqa metodikalar bo‘yicha qamrov</span>
        <span class="dist-badge">{{ totals.totalStudents }} ta talabadan</span>
      </header>

      <div class="dist-grid">
        <div v-for="it in scaleItems" :key="it.key" class="dist-card" :style="{ '--c': it.color }">
          <div class="dist-icon"><v-icon :icon="it.icon" size="26" /></div>
          <div class="dist-label">{{ it.label }}</div>
          <div class="dist-count text-display">{{ it.count }}</div>
          <div class="dist-unit text-medium-emphasis">talaba topshirgan</div>
          <div class="dist-bar-row">
            <div class="dist-bar"><div class="dist-bar-fill" :style="{ width: `${it.pct}%` }" /></div>
            <span class="dist-pct">{{ fmtPct(it.pct) }}</span>
          </div>
        </div>
      </div>
    </section>

    <div class="text-subtitle-1 font-weight-bold mt-8 mb-3">Fakultetlar kesimida</div>
    <v-card v-for="f in data.faculties" :key="f.id" class="surface-card mb-3" rounded="lg">
      <button class="faculty-header w-100 d-flex align-center justify-space-between pa-4" @click="toggle(f.id)">
        <div class="text-left flex-grow-1" style="min-width: 0">
          <div class="text-body-1 font-weight-bold">{{ f.name }}</div>
          <div class="d-flex align-center mt-2" style="gap: 10px; max-width: 360px">
            <v-progress-linear :model-value="facultyPct(f)" height="6" rounded color="primary" bg-color="surface-variant" />
            <span class="text-caption font-weight-bold" style="min-width: 36px">{{ facultyPct(f) }}%</span>
          </div>
        </div>
        <div class="d-flex align-center flex-shrink-0" style="gap: 10px">
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
                <div class="d-flex justify-space-between text-caption mb-1">
                  <span class="d-flex align-center" style="gap: 6px">
                    <v-icon :icon="SHAPE_ICONS[g.key] ?? 'mdi-shape-outline'" size="14" :color="figureColor(g.key)" />{{ g.key }}
                  </span>
                  <span>{{ g.count }}</span>
                </div>
                <v-progress-linear :model-value="(g.count / maxOf(f.figures)) * 100" height="5" rounded :color="figureColor(g.key)" bg-color="surface-variant" />
              </div>
              <div v-if="!f.figures.length" class="text-caption text-medium-emphasis">—</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="text-caption text-medium-emphasis text-uppercase mb-2">Temperament</div>
              <div v-for="t in f.temperaments" :key="t.key" class="mb-2">
                <div class="d-flex justify-space-between text-caption mb-1">
                  <span class="d-flex align-center" style="gap: 6px">
                    <v-icon :icon="TEMPERAMENT_ICONS[t.key] ?? 'mdi-account-heart-outline'" size="14" :color="tempColor(t.key)" />{{ t.key }}
                  </span>
                  <span>{{ t.count }}</span>
                </div>
                <v-progress-linear :model-value="(t.count / maxOf(f.temperaments)) * 100" height="5" rounded :color="tempColor(t.key)" bg-color="surface-variant" />
              </div>
              <div v-if="!f.temperaments.length" class="text-caption text-medium-emphasis">—</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="text-caption text-medium-emphasis text-uppercase mb-2">Boshqa metodikalar</div>
              <div v-for="s in f.scales" :key="s.algo" class="d-flex justify-space-between text-caption mb-2">
                <span class="d-flex align-center" style="gap: 6px">
                  <v-icon :icon="scaleMeta(s.algo).icon" size="14" :color="scaleMeta(s.algo).tint" />{{ scaleLabel(s.algo) }}
                </span>
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
.stat-value {
  font-size: 1.9rem;
  font-weight: 700;
  line-height: 1.15;
}

.dist-section {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

/* Metodika rangidagi sarlavha lentasi — rasmdagi rangli header'ning
   "calm care" talqini: to'liq bo'yoq emas, yumshoq gradient. */
.dist-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 14px 20px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--tint) 22%, rgb(var(--v-theme-surface))) 0%,
    color-mix(in srgb, var(--tint) 6%, rgb(var(--v-theme-surface))) 100%
  );
  border-bottom: 1px solid color-mix(in srgb, var(--tint) 25%, transparent);
}
.dist-head-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--tint);
  color: #fff;
  flex-shrink: 0;
}
.dist-head-title {
  font-weight: 700;
  font-size: 0.95rem;
}
.dist-badge {
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 700;
  background: rgb(var(--v-theme-surface));
  color: var(--tint);
  border: 1px solid color-mix(in srgb, var(--tint) 35%, transparent);
}

.dist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 14px;
  padding: 18px 20px 20px;
}

.dist-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 18px 16px 16px;
  border-radius: var(--radius);
  border: 1px solid color-mix(in srgb, var(--c) 30%, transparent);
  border-top: 3px solid var(--c);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--c) 9%, rgb(var(--v-theme-surface))) 0%,
    rgb(var(--v-theme-surface)) 70%
  );
  transition: transform 0.18s var(--ease), box-shadow 0.18s var(--ease);
}
.dist-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.dist-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--c) 14%, transparent);
  color: var(--c);
}
.dist-label {
  margin-top: 10px;
  font-size: 0.875rem;
  font-weight: 600;
}
.dist-count {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
  margin-top: 2px;
  color: var(--c);
}
.dist-unit {
  font-size: 0.75rem;
}

.dist-bar-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}
.dist-bar {
  flex-grow: 1;
  height: 8px;
  border-radius: 99px;
  background: rgb(var(--v-theme-surface-variant));
  overflow: hidden;
}
.dist-bar-fill {
  height: 100%;
  border-radius: 99px;
  background: var(--c);
  transition: width 0.6s var(--ease);
}
.dist-pct {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--c);
  min-width: 42px;
  text-align: right;
}

@media (max-width: 599px) {
  .dist-head {
    padding: 12px 14px;
  }
  .dist-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    padding: 14px;
  }
  .dist-card {
    padding: 14px 10px 12px;
  }
  .dist-icon {
    width: 42px;
    height: 42px;
  }
  .dist-count {
    font-size: 1.4rem;
  }
  .dist-bar-row {
    gap: 6px;
  }
  .dist-pct {
    min-width: 36px;
  }
}

.faculty-header {
  background: transparent;
  border: none;
  cursor: pointer;
  color: inherit;
  border-radius: 20px;
  gap: 16px;
}
</style>
