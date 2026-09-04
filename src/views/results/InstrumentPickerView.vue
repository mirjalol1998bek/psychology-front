<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FacultyGroupPicker from '@/components/psixologiya/FacultyGroupPicker.vue'
import { FACULTIES, GROUPS_BY_FACULTY } from '@/mocks/organization'
import { instrumentByRoute, INSTRUMENT_META } from '@/utils/instruments'
import type { FacultyDto, GroupDto } from '@/types/domain'

const route = useRoute()
const router = useRouter()

const instrument = computed(() => instrumentByRoute(route.params.instrument as string))
const meta = computed(() => INSTRUMENT_META[instrument.value])

function handleSelect(faculty: FacultyDto, group: GroupDto) {
  router.push(`/results/${meta.value.routeSegment}/${faculty.id}/${group.id}`)
}
</script>

<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" class="text-none mb-2" @click="router.push('/results')">Orqaga</v-btn>
    <h1 class="text-display text-h4 font-weight-800 mb-1">{{ meta.label }} natijalari</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">Fakultet va guruhni tanlang.</p>
    <FacultyGroupPicker :faculties="FACULTIES" :groups-by-faculty="GROUPS_BY_FACULTY" @select="handleSelect" />
  </div>
</template>
