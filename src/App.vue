<script setup lang="ts">
import { useThemeMode } from '@/composables/useThemeMode'

// Bind persisted light / dark / system preference to Vuetify on startup.
useThemeMode()
</script>

<template>
  <router-view />
</template>
