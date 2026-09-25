<script setup lang="ts">
import { computed, ref } from 'vue'
import type { InstrumentType } from '@/types/domain'
import { INSTRUMENT_META, colorFor, splitTypes, SHAPE_ICONS, TEMPERAMENT_ICONS } from '@/utils/instruments'

const props = defineProps<{
  instrument: InstrumentType
  /** temperament type / geometric figure name / freetext conclusion — whichever applies */
  value: string | null | undefined
  description?: string
}>()

const mode = computed(() => INSTRUMENT_META[props.instrument].renderMode)
// Teng ballli temperament — bir nechta tur, har biri alohida chip (hech biri ustun emas).
const types = computed(() => splitTypes(props.value))

function iconFor(type: string): string {
  if (props.instrument === 'RANKING_BASED') return SHAPE_ICONS[type] ?? 'mdi-shape-outline'
  return TEMPERAMENT_ICONS[type] ?? 'mdi-account-heart'
}

const detail = ref<string | null>(null)
const detailColor = computed(() => colorFor(props.instrument, detail.value))
</script>

<template>
  <span v-if="mode === 'freetext'" class="text-body-2" style="white-space: pre-wrap">
    {{ value || 'Xulosa yo‘q' }}
  </span>

  <template v-else>
    <span v-if="types.length" class="d-inline-flex flex-wrap" style="gap: 4px">
      <v-chip
        v-for="type in types"
        :key="type"
        :style="{ background: `${colorFor(instrument, type)}26`, color: colorFor(instrument, type) }"
        class="font-weight-bold cursor-pointer"
        size="small"
        @click="detail = type"
      >
        <v-icon v-if="mode === 'icon-badge'" :icon="iconFor(type)" start size="15" />
        {{ type }}
      </v-chip>
    </span>
    <span v-else class="text-caption text-medium-emphasis">Aniqlanmagan</span>

    <v-dialog :model-value="detail !== null" max-width="380" @update:model-value="(v) => !v && (detail = null)">
      <v-card v-if="detail" class="surface-card pa-6 text-center" rounded="lg">
        <div class="detail-icon mx-auto mb-4" :style="{ background: `linear-gradient(135deg, ${detailColor}, ${detailColor}99)` }">
          <v-icon :icon="iconFor(detail)" color="white" size="34" />
        </div>
        <div class="text-h6 font-weight-bold mb-2">{{ detail }}</div>
        <p v-if="types.length > 1" class="text-caption text-medium-emphasis mb-2">
          Aralash natija: {{ types.join(' + ') }} — ballari teng.
        </p>
        <p class="text-body-2 text-medium-emphasis mb-4">
          {{ description || 'Ushbu natija bo‘yicha batafsil tavsif hali kiritilmagan.' }}
        </p>
        <v-btn variant="tonal" color="primary" class="text-none" @click="detail = null">Yopish</v-btn>
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
