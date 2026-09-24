<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import FacultyGroupPicker from '@/components/psixologiya/FacultyGroupPicker.vue'
import PassportZipDialog from '@/components/psixologiya/PassportZipDialog.vue'
import { useOrganizationStore } from '@/stores/organization'
import { fetchFacultyPassports } from '@/services/groupReport'
import { usePassportZip } from '@/composables/usePassportZip'
import { fileSlug } from '@/utils/exportXlsx'
import type { FacultyDto, GroupDto } from '@/types/domain'

const router = useRouter()
const org = useOrganizationStore()
org.load()
const { faculties, groupsByFaculty } = storeToRefs(org)

const activeFacultyId = ref<string | null>(null)
const activeFaculty = computed(() => (activeFacultyId.value ? org.facultyById(activeFacultyId.value) : undefined))

const loadingGroups = ref(false)
async function onFacultyChange(facultyId: string) {
  activeFacultyId.value = facultyId
  loadingGroups.value = true
  try {
    await org.loadGroups(facultyId)
  } finally {
    loadingGroups.value = false
  }
}

function handleSelect(faculty: FacultyDto, group: GroupDto) {
  router.push({ name: 'passports-group', params: { facultyId: faculty.id, groupId: group.id } })
}

const zip = usePassportZip()
const toast = ref('')

/** Arxivda har bir guruh — alohida papka, ichida talabalar PDF'lari. */
async function downloadFacultyZip() {
  const faculty = activeFaculty.value
  if (!faculty) return
  await zip.run(async () => {
    const list = await fetchFacultyPassports(faculty.id)
    return list.map((p) => ({
      folder: p.groupName,
      input: {
        fullName: p.fullName,
        hemisId: p.hemisId,
        faculty: faculty.name,
        group: p.groupName,
        personalCode: p.personalCode,
        passport: p.passport,
      },
    }))
  }, `pasportlar_${fileSlug(faculty.name)}`)
  if (zip.message.value) toast.value = zip.message.value
}
</script>

<template>
  <div>
    <div class="d-flex align-end justify-space-between page-head flex-wrap" style="gap: 12px">
      <div>
        <h1 class="text-h4">Talabalar pasportlari</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Fakultet va guruhni tanlang — kim ijtimoiy-psixologik anketani to‘ldirganini ko‘ring va har birini PDF qilib yuklab oling.
        </p>
      </div>
      <v-btn
        variant="tonal"
        color="secondary"
        prepend-icon="mdi-folder-zip-outline"
        :disabled="!activeFaculty || zip.active.value"
        @click="downloadFacultyZip"
      >
        Fakultet arxivi (ZIP)
      </v-btn>
    </div>
    <FacultyGroupPicker
      :faculties="faculties"
      :groups-by-faculty="groupsByFaculty"
      :loading-groups="loadingGroups"
      @faculty-change="onFacultyChange"
      @select="handleSelect"
    />

    <PassportZipDialog
      :active="zip.active.value"
      :done="zip.done.value"
      :total="zip.total.value"
      :title="`${activeFaculty?.name ?? 'Fakultet'} — pasportlar arxivi`"
      @cancel="zip.cancel"
    />

    <v-snackbar :model-value="!!toast" color="error" timeout="3500" @update:model-value="toast = ''">{{ toast }}</v-snackbar>
  </div>
</template>
