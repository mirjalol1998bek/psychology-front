<script setup lang="ts">
import { computed, ref } from 'vue'
import type { InstrumentType } from '@/types/domain'
import { INSTRUMENT_META, colorFor, SHAPE_ICONS } from '@/utils/instruments'

const props = defineProps<{
  instrument: InstrumentType
  /** temperament type / geometric figure name / nevrasteniya conclusion — whichever applies */
  value: string | null | undefined
  description?: string
}>()

const mode = computed(() => INSTRUMENT_META[props.instrument].renderMode)
const color = computed(() => colorFor(props.instrument, props.value))
const shapeIcon = computed(() => (props.value ? SHAPE_ICONS[props.value] ?? 'mdi-shape-outline' : 'mdi-help-circle-outline'))

const showDetail = ref(false)
</script>

<template>
  <span v-if="mode === 'freetext'" class="text-body-2" style="white-space: pre-wrap">
    {{ value || 'Xulosa yo‘q' }}
  </span>

  <template v-else>
    <v-chip
      v-if="value"
      :style="{ background: `${color}26`, color }"
      class="font-weight-700 cursor-pointer"
      size="small"
      @click="showDetail = true"
    >
      <v-icon v-if="mode === 'icon-badge'" :icon="shapeIcon" start size="15" />
      {{ value }}
    </v-chip>
    <span v-else class="text-caption text-medium-emphasis">Aniqlanmagan</span>

    <v-dialog v-model="showDetail" max-width="380">
      <v-card class="surface-glass pa-6 text-center" rounded="xl">
        <div class="detail-icon mx-auto mb-4" :style="{ background: `linear-gradient(135deg, ${color}, ${color}99)` }">
          <v-icon :icon="mode === 'icon-badge' ? shapeIcon : 'mdi-account-heart'" color="white" size="34" />
        </div>
        <div class="text-h6 font-weight-800 mb-2">{{ value }}</div>
        <p class="text-body-2 text-medium-emphasis mb-4">
          {{ description || 'Ushbu natija bo‘yicha batafsil tavsif hali kiritilmagan.' }}
        </p>
        <v-btn variant="tonal" color="primary" class="text-none" @click="showDetail = false">Yopish</v-btn>
      </v-card>
    </v-dialog>
  </template>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.detail-icon {
  width: 76px;
  height: 76px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
