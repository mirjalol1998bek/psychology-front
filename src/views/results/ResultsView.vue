<script setup lang="ts">
const results = [
  { title: 'Temperament testi', label: 'Sangvinik', color: 'primary', date: '02.09.2026' },
  { title: 'Psixogeometrik test', label: 'Doira', color: 'secondary', date: '28.08.2026' },
  { title: 'Nevrasteniya so‘rovnomasi', label: '18 ball — past daraja', color: 'info', date: '20.08.2026' },
]
</script>

<template>
  <div>
    <h1 class="text-display text-h4 font-weight-600 mb-1">Natijalar</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">Topshirilgan testlaringiz bo‘yicha xulosalar.</p>

    <v-card v-for="r in results" :key="r.title" elevation="1" class="pa-4 mb-3 d-flex align-center" style="gap: 16px">
      <v-avatar :color="r.color" variant="tonal" rounded="lg" size="44">
        <v-icon icon="mdi-file-chart-outline" :color="r.color" />
      </v-avatar>
      <div class="flex-grow-1">
        <div class="text-subtitle-1 font-weight-600">{{ r.title }}</div>
        <div class="text-caption text-medium-emphasis">{{ r.date }}</div>
      </div>
      <v-chip :color="r.color" variant="tonal">{{ r.label }}</v-chip>
      <v-btn icon="mdi-download-outline" variant="text" color="primary" />
    </v-card>
  </div>
</template>
