<script setup lang="ts">
// Placeholder — wired to GET /admin/result/fakulty once the backend exists.
const faculties = [
  { name: 'Xorijiy filologiya fakulteti', total: 412, tested: 356, pct: 86 },
  { name: 'Tarix fakulteti', total: 268, tested: 190, pct: 71 },
  { name: 'Jurnalistika fakulteti', total: 190, tested: 132, pct: 69 },
]
</script>

<template>
  <div>
    <h1 class="text-display text-h4 font-weight-600 mb-1">Statistika</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">Fakultetlar kesimida test qamrovi.</p>

    <v-card v-for="f in faculties" :key="f.name" elevation="1" class="pa-4 mb-3">
      <div class="d-flex align-center justify-space-between mb-2">
        <span class="text-subtitle-1 font-weight-600">{{ f.name }}</span>
        <span class="text-caption text-medium-emphasis">{{ f.tested }} / {{ f.total }} talaba</span>
      </div>
      <v-progress-linear :model-value="f.pct" height="10" rounded color="primary" bg-color="surface-variant" />
      <div class="text-caption text-medium-emphasis mt-1">{{ f.pct }}% qamrov</div>
    </v-card>
  </div>
</template>
