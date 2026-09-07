<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import FacultyGroupPicker from '@/components/psixologiya/FacultyGroupPicker.vue'
import { useOrganizationStore } from '@/stores/organization'
import type { FacultyDto, GroupDto } from '@/types/domain'

const router = useRouter()
const org = useOrganizationStore()
const { faculties, groupsByFaculty } = storeToRefs(org)

function handleSelect(faculty: FacultyDto, group: GroupDto) {
  router.push({ name: 'tekshirish-group', params: { facultyId: faculty.id, groupId: group.id } })
}
</script>

<template>
  <div>
    <header class="page-head">
      <h1 class="text-h4">Tekshirish paneli</h1>
      <p class="text-body-2 text-medium-emphasis mb-0">
        Fakultet va guruhni tanlang — talabalarning temperament va psixogeometrik natijalarini bir joyda ko‘ring.
      </p>
    </header>
    <FacultyGroupPicker :faculties="faculties" :groups-by-faculty="groupsByFaculty" @select="handleSelect" />
  </div>
</template>
