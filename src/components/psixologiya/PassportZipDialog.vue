<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  active: boolean
  done: number
  /** 0 — ro'yxat hali yuklanmoqda. */
  total: number
  title: string
}>()

defineEmits<{ cancel: [] }>()

const pct = computed(() => (props.total ? Math.round((props.done / props.total) * 100) : 0))
</script>

<template>
  <v-dialog :model-value="active" max-width="420" persistent>
    <v-card class="pa-6" rounded="lg">
      <div class="d-flex align-center mb-4" style="gap: 12px">
        <div class="icon-tile" style="--tint: rgb(var(--v-theme-secondary))"><v-icon icon="mdi-folder-zip-outline" size="20" /></div>
        <div class="zip-title">{{ title }}</div>
      </div>

      <template v-if="total">
        <div class="d-flex justify-space-between zip-caption mb-2">
          <span>PDF tayyorlanmoqda</span>
          <span class="font-weight-bold">{{ done }} / {{ total }}</span>
        </div>
        <v-progress-linear :model-value="pct" height="8" rounded color="secondary" bg-color="surface-variant" />
      </template>
      <template v-else>
        <div class="zip-caption mb-2">Anketalar ro‘yxati yuklanmoqda…</div>
        <v-progress-linear indeterminate height="8" rounded color="secondary" bg-color="surface-variant" />
      </template>

      <p class="zip-caption text-medium-emphasis mt-4 mb-0">
        Oynani yopmang — tayyor bo‘lgach arxiv avtomatik yuklab olinadi.
      </p>

      <div class="d-flex justify-end mt-4">
        <v-btn variant="text" @click="$emit('cancel')">Bekor qilish</v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.zip-title {
  font-weight: 700;
  font-size: 1rem;
  line-height: 1.3;
}
.zip-caption {
  font-size: 0.85rem;
}
</style>
