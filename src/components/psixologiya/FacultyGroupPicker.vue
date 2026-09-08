<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { FacultyDto, GroupDto } from '@/types/domain'

const props = defineProps<{
  faculties: FacultyDto[]
  groupsByFaculty: Record<string, GroupDto[]>
}>()

const emit = defineEmits<{ select: [faculty: FacultyDto, group: GroupDto] }>()

const activeFacultyId = ref(props.faculties[0]?.id ?? '')
// Faculties load asynchronously — select the first one once they arrive.
watch(
  () => props.faculties,
  (list) => {
    if (!activeFacultyId.value && list.length) activeFacultyId.value = list[0].id
  },
  { immediate: true },
)
const activeFaculty = computed(() => props.faculties.find((f) => f.id === activeFacultyId.value))
const groups = computed(() => props.groupsByFaculty[activeFacultyId.value] ?? [])
</script>

<template>
  <v-row>
    <v-col cols="12" md="4" lg="3">
      <v-card class="surface-card pa-2" rounded="lg">
        <div class="px-3 pt-2 pb-1 text-caption font-weight-bold text-medium-emphasis text-uppercase">Fakultetlar</div>
        <v-list nav density="comfortable" bg-color="transparent">
          <v-list-item
            v-for="f in faculties"
            :key="f.id"
            :active="f.id === activeFacultyId"
            rounded="lg"
            class="mb-1 faculty-item"
            :class="{ 'faculty-item--active': f.id === activeFacultyId }"
            @click="activeFacultyId = f.id"
          >
            <v-list-item-title class="font-weight-medium">{{ f.name }}</v-list-item-title>
            <template #append>
              <v-chip size="x-small" variant="tonal">{{ f.groupCount }}</v-chip>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-col>

    <v-col cols="12" md="8" lg="9">
      <v-card class="surface-card pa-5" rounded="lg" min-height="100%">
        <div class="text-subtitle-1 font-weight-bold mb-4">
          {{ activeFaculty?.name }} — guruhlar
        </div>
        <v-row v-if="groups.length">
          <v-col v-for="g in groups" :key="g.id" cols="6" sm="4" lg="3">
            <button class="group-tile w-100" @click="activeFaculty && emit('select', activeFaculty, g)">
              <div class="icon-tile mb-2" style="--tint: rgb(var(--v-theme-primary))">
                <v-icon icon="mdi-account-group-outline" size="20" />
              </div>
              <div class="text-body-2 font-weight-bold">{{ g.name }}</div>
              <div class="text-caption text-medium-emphasis">{{ g.studentCount }} talaba</div>
            </button>
          </v-col>
        </v-row>
        <v-empty-state v-else icon="mdi-folder-open-outline" title="Guruh topilmadi" density="compact" />
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.faculty-item--active {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.group-tile {
  background: rgb(var(--v-theme-surface-variant));
  border: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.6));
  border-radius: var(--radius);
  padding: 16px 14px;
  text-align: left;
  cursor: pointer;
  transition: transform 0.15s var(--ease), border-color 0.15s var(--ease);
}

.group-tile:hover {
  transform: translateY(-2px);
  border-color: rgb(var(--v-theme-primary));
}
</style>
