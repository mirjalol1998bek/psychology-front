<script setup lang="ts">
import { ref, computed } from 'vue'
import { INSTRUMENT_META } from '@/utils/instruments'
import type { AssignmentDto, InstrumentType } from '@/types/domain'

// Placeholder — wired to GET /admin/assignments once the backend exists.
const assignments: AssignmentDto[] = [
  { id: 'as1', categoryId: 'c1', categoryName: 'Temperament testi', instrumentType: 'FREQUENCY_BASED', facultyId: 'f1', groupId: 'g1', groupName: '21-FIL-14', quizTitles: ['Temperament tipini aniqlash'], startAt: '2026-09-01', endAt: '2026-09-12', isActive: true },
  { id: 'as2', categoryId: 'c2', categoryName: 'Psixogeometrik test', instrumentType: 'RANKING_BASED', facultyId: 'f1', groupId: 'g2', groupName: '21-FIL-15', quizTitles: ['Psixogeometrik test'], startAt: '2026-09-03', endAt: '2026-09-14', isActive: true },
  { id: 'as3', categoryId: 'c3', categoryName: 'Nevrasteniya so‘rovnomasi', instrumentType: 'SCORE_RANGE_BASED', facultyId: 'f2', groupId: 'g4', groupName: '22-TAR-03', quizTitles: ['Nevrasteniya so‘rovnomasi'], startAt: '2026-08-28', endAt: '2026-09-15', isActive: false },
]

const categoryFilter = ref<InstrumentType | 'all'>('all')
const search = ref('')

const filtered = computed(() =>
  assignments.filter((a) => {
    if (categoryFilter.value !== 'all' && a.instrumentType !== categoryFilter.value) return false
    if (search.value && !a.groupName.toLowerCase().includes(search.value.toLowerCase())) return false
    return true
  }),
)
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between page-head flex-wrap" style="gap: 12px">
      <div>
        <h1 class="text-h4">Biriktirilgan guruhlar</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">{{ assignments.length }} ta faol va o‘tgan tayinlash</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" to="/assignments/create">Yangi biriktirish</v-btn>
    </div>

    <div class="d-flex flex-wrap align-center mb-4" style="gap: 8px">
      <v-chip :variant="categoryFilter === 'all' ? 'flat' : 'tonal'" :color="categoryFilter === 'all' ? 'primary' : undefined" @click="categoryFilter = 'all'">
        Barchasi
      </v-chip>
      <v-chip
        v-for="[key, meta] in Object.entries(INSTRUMENT_META)" :key="key"
        :variant="categoryFilter === key ? 'flat' : 'tonal'" :color="categoryFilter === key ? 'primary' : undefined"
        @click="categoryFilter = key as InstrumentType"
      >
        {{ meta.label }}
      </v-chip>
      <v-spacer />
      <v-text-field v-model="search" density="compact" variant="solo-filled" rounded="lg" hide-details flat bg-color="surface-variant" prepend-inner-icon="mdi-magnify" placeholder="Guruh qidirish..." style="max-width: 220px" class="app-search" />
    </div>

    <v-card class="surface-card" rounded="lg">
      <v-table>
        <thead>
          <tr>
            <th>Metodika</th>
            <th>Guruh</th>
            <th>Boshlanishi</th>
            <th>Tugashi</th>
            <th>Holati</th>
            <th class="text-right">Amallar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in filtered" :key="a.id">
            <td class="d-flex align-center py-3" style="gap: 10px">
              <div class="icon-tile" style="--tint: rgb(var(--v-theme-primary)); width: 34px; height: 34px">
                <v-icon :icon="INSTRUMENT_META[a.instrumentType].icon" size="17" />
              </div>
              <span class="font-weight-bold">{{ a.categoryName }}</span>
            </td>
            <td><v-chip size="small" variant="tonal" color="secondary">{{ a.groupName }}</v-chip></td>
            <td>{{ a.startAt }}</td>
            <td>{{ a.endAt }}</td>
            <td>
              <v-chip size="small" variant="tonal" :color="a.isActive ? 'success' : undefined">
                {{ a.isActive ? 'Faol' : 'Nofaol' }}
              </v-chip>
            </td>
            <td class="text-right">
              <v-btn :to="`/results/${INSTRUMENT_META[a.instrumentType].routeSegment}/${a.facultyId}/${a.groupId}`" icon="mdi-chart-box-outline" variant="text" size="small" color="secondary" />
              <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" />
            </td>
          </tr>
        </tbody>
      </v-table>
      <v-empty-state v-if="!filtered.length" icon="mdi-clipboard-off-outline" title="Tayinlash topilmadi" density="compact" />
    </v-card>
  </div>
</template>
