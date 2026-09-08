<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import FacultyGroupPicker from '@/components/psixologiya/FacultyGroupPicker.vue'
import { useOrganizationStore } from '@/stores/organization'
import { instrumentByRoute, INSTRUMENT_META } from '@/utils/instruments'
import type { FacultyDto, GroupDto } from '@/types/domain'

const route = useRoute()
const router = useRouter()
const org = useOrganizationStore()
org.load()
const { faculties, groupsByFaculty } = storeToRefs(org)

const instrument = computed(() => instrumentByRoute(route.params.instrument as string))
const meta = computed(() => INSTRUMENT_META[instrument.value])

function handleSelect(faculty: FacultyDto, group: GroupDto) {
  router.push(`/results/${meta.value.routeSegment}/${faculty.id}/${group.id}`)
}
</script>

<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-3" @click="router.push('/results')">Orqaga</v-btn>
    <header class="page-head">
      <h1 class="text-h4">{{ meta.label }} natijalari</h1>
      <p class="text-body-2 text-medium-emphasis mb-0">Fakultet va guruhni tanlang.</p>
    </header>
    <FacultyGroupPicker :faculties="faculties" :groups-by-faculty="groupsByFaculty" @select="handleSelect" />
  </div>
</template>
