<script setup lang="ts">
import { useRouter } from 'vue-router'
import FacultyGroupPicker from '@/components/psixologiya/FacultyGroupPicker.vue'
import { FACULTIES, GROUPS_BY_FACULTY } from '@/mocks/organization'
import type { FacultyDto, GroupDto } from '@/types/domain'

const router = useRouter()

function handleSelect(faculty: FacultyDto, group: GroupDto) {
  router.push({ name: 'tekshirish-group', params: { facultyId: faculty.id, groupId: group.id } })
}
</script>

<template>
  <div>
    <h1 class="text-display text-h4 font-weight-800 mb-1">Tekshirish paneli</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">
      Fakultet va guruhni tanlang — talabalarning temperament va psixogeometrik natijalarini bir joyda ko‘ring.
    </p>
    <FacultyGroupPicker :faculties="FACULTIES" :groups-by-faculty="GROUPS_BY_FACULTY" @select="handleSelect" />
  </div>
</template>
