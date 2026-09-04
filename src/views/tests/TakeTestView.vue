<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <v-empty-state
    icon="mdi-clipboard-text-play-outline"
    headline="Test topshirish oynasi"
    title="Bu ekran hali ulanmagan"
    text="Har bir metodika (temperament, psixogeometrik, nevrasteniya...) o‘z savol-render komponentiga ega bo‘ladi — TZ §7 dagi skorlash arxitekturasiga mos."
  >
    <template #media>
      <v-avatar color="primary" variant="tonal" size="72" rounded="lg">
        <v-icon icon="mdi-clipboard-text-play-outline" size="36" color="primary" />
      </v-avatar>
    </template>
    <template #actions>
      <v-chip variant="tonal" color="primary" class="mb-2">test ID: {{ route.params.id }}</v-chip>
      <v-btn variant="tonal" color="primary" class="text-none" to="/tests">Testlar ro‘yxatiga qaytish</v-btn>
    </template>
  </v-empty-state>
</template>
