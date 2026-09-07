<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOrganizationStore } from '@/stores/organization'
import { useAuthStore } from '@/stores/auth'
import type { StudyLanguage } from '@/types/domain'

const org = useOrganizationStore()
const auth = useAuthStore()
const router = useRouter()

const selFacultyId = ref<string | null>(org.faculties[0]?.id ?? null)
const selGroupId = ref<string | null>(null)

const selFaculty = computed(() => org.faculties.find((f) => f.id === selFacultyId.value) ?? null)
const groups = computed(() => (selFacultyId.value ? org.groupsByFaculty[selFacultyId.value] ?? [] : []))
const selGroup = computed(() => groups.value.find((g) => g.id === selGroupId.value) ?? null)
const students = computed(() => (selGroupId.value ? org.studentsForGroup(selGroupId.value) : []))

// Reset the downstream selection whenever its parent changes.
watch(selFacultyId, () => {
  selGroupId.value = null
})

// --- add forms -------------------------------------------------------------
const newFaculty = ref('')
const newGroup = ref('')
const newGroupLang = ref<StudyLanguage>('uz')
const newStudent = ref('')
const newStudentId = ref('')
const toast = ref('')
const toastOpen = ref(false)
const confirmReset = ref(false)

function doReset() {
  org.reset()
  selFacultyId.value = org.faculties[0]?.id ?? null
  selGroupId.value = null
  confirmReset.value = false
  notify('Boshlang‘ich holat tiklandi')
}

const langOptions: { title: string; value: StudyLanguage }[] = [
  { title: 'O‘zbek', value: 'uz' },
  { title: 'Rus', value: 'ru' },
]

function notify(msg: string) {
  toast.value = msg
  toastOpen.value = true
}

function addFaculty() {
  if (!newFaculty.value.trim()) return
  const f = org.addFaculty(newFaculty.value)
  newFaculty.value = ''
  selFacultyId.value = f.id
  notify('Fakultet qo‘shildi')
}

function addGroup() {
  if (!selFacultyId.value || !newGroup.value.trim()) return
  const g = org.addGroup(selFacultyId.value, newGroup.value, newGroupLang.value)
  newGroup.value = ''
  selGroupId.value = g.id
  notify('Guruh qo‘shildi')
}

function addStudent() {
  if (!selGroupId.value || !newStudent.value.trim()) return
  org.addStudent(selGroupId.value, newStudent.value, newStudentId.value)
  newStudent.value = ''
  newStudentId.value = ''
  notify('Talaba qo‘shildi')
}

function viewAsStudent(fullName: string, hemisId: string) {
  auth.viewAsStudent({
    fullName,
    hemisId,
    faculty: selFaculty.value?.name ?? '—',
    group: selGroup.value?.name ?? '—',
    studyLanguage: selGroup.value?.studyLanguage ?? 'uz',
  })
  router.push('/tests')
}

const addedIds = computed(() => new Set(Object.values(org.addedStudents).flat().map((s) => s.id)))
</script>

<template>
  <div>
    <div class="d-flex align-end justify-space-between page-head flex-wrap" style="gap: 12px">
      <div>
        <h1 class="text-h4">Tashkilot tuzilmasi</h1>
        <p class="text-body-2 text-medium-emphasis mb-0" style="max-width: 62ch">
          Yangi testni talaba tomonidan tekshirish uchun fakultet, guruh va talaba qo‘shing.
          Qo‘shilgan talaba testni hali topshirmagan holatda bo‘ladi.
        </p>
      </div>
      <v-btn variant="text" size="small" prepend-icon="mdi-restore" @click="confirmReset = true">
        Boshlang‘ich holat
      </v-btn>
    </div>

    <v-row>
      <!-- Faculties -->
      <v-col cols="12" md="4">
        <v-card class="surface-card d-flex flex-column h-100" rounded="lg">
          <div class="px-4 pt-4 pb-2 d-flex align-center justify-space-between">
            <span class="text-subtitle-2 font-weight-bold text-uppercase">Fakultetlar</span>
            <v-chip size="x-small" variant="tonal">{{ org.faculties.length }}</v-chip>
          </div>
          <v-list nav density="comfortable" class="flex-grow-1" bg-color="transparent" style="min-height: 120px">
            <v-list-item
              v-for="f in org.faculties"
              :key="f.id"
              :active="f.id === selFacultyId"
              rounded="lg"
              class="mb-1 pick-item"
              @click="selFacultyId = f.id"
            >
              <v-list-item-title class="font-weight-medium">{{ f.name }}</v-list-item-title>
              <template #append>
                <v-chip size="x-small" variant="tonal">{{ f.groupCount }}</v-chip>
              </template>
            </v-list-item>
          </v-list>
          <div class="pa-3 surface-sunken" style="border-radius: 0 0 var(--radius) var(--radius)">
            <v-text-field
              v-model="newFaculty"
              density="compact"
              hide-details
              placeholder="Yangi fakultet nomi"
              class="mb-2"
              @keydown.enter="addFaculty"
            />
            <v-btn size="small" block color="primary" variant="tonal" prepend-icon="mdi-plus" :disabled="!newFaculty.trim()" @click="addFaculty">
              Fakultet qo‘shish
            </v-btn>
          </div>
        </v-card>
      </v-col>

      <!-- Groups -->
      <v-col cols="12" md="4">
        <v-card class="surface-card d-flex flex-column h-100" rounded="lg">
          <div class="px-4 pt-4 pb-2 d-flex align-center justify-space-between">
            <span class="text-subtitle-2 font-weight-bold text-uppercase">Guruhlar</span>
            <v-chip size="x-small" variant="tonal">{{ groups.length }}</v-chip>
          </div>
          <div v-if="!selFacultyId" class="pa-6 text-center text-caption text-medium-emphasis flex-grow-1">
            Avval fakultet tanlang
          </div>
          <template v-else>
            <v-list nav density="comfortable" class="flex-grow-1" bg-color="transparent" style="min-height: 120px">
              <v-list-item
                v-for="g in groups"
                :key="g.id"
                :active="g.id === selGroupId"
                rounded="lg"
                class="mb-1 pick-item"
                @click="selGroupId = g.id"
              >
                <v-list-item-title class="font-weight-medium">{{ g.name }}</v-list-item-title>
                <template #append>
                  <span class="text-caption text-medium-emphasis">{{ g.studentCount }} ta</span>
                </template>
              </v-list-item>
              <div v-if="!groups.length" class="pa-4 text-center text-caption text-medium-emphasis">Guruh yo‘q</div>
            </v-list>
            <div class="pa-3 surface-sunken" style="border-radius: 0 0 var(--radius) var(--radius)">
              <v-text-field
                v-model="newGroup"
                density="compact"
                hide-details
                placeholder="Guruh nomi (masalan 22-11)"
                class="mb-2"
                @keydown.enter="addGroup"
              />
              <v-select
                v-model="newGroupLang"
                :items="langOptions"
                item-title="title"
                item-value="value"
                density="compact"
                hide-details
                label="Ta’lim tili"
                class="mb-2"
              />
              <v-btn size="small" block color="primary" variant="tonal" prepend-icon="mdi-plus" :disabled="!newGroup.trim()" @click="addGroup">
                Guruh qo‘shish
              </v-btn>
            </div>
          </template>
        </v-card>
      </v-col>

      <!-- Students -->
      <v-col cols="12" md="4">
        <v-card class="surface-card d-flex flex-column h-100" rounded="lg">
          <div class="px-4 pt-4 pb-2 d-flex align-center justify-space-between">
            <span class="text-subtitle-2 font-weight-bold text-uppercase">Talabalar</span>
            <v-chip size="x-small" variant="tonal">{{ students.length }}</v-chip>
          </div>
          <div v-if="!selGroupId" class="pa-6 text-center text-caption text-medium-emphasis flex-grow-1">
            Avval guruh tanlang
          </div>
          <template v-else>
            <div class="flex-grow-1 px-2 py-1" style="max-height: 420px; overflow-y: auto; min-height: 120px">
              <div
                v-for="s in students"
                :key="s.id"
                class="d-flex align-center py-2 px-2 student-row"
                style="gap: 10px"
              >
                <v-avatar size="30" color="primary" variant="tonal">
                  <span class="text-caption font-weight-bold">{{ s.fullName[0] }}</span>
                </v-avatar>
                <div class="flex-grow-1" style="min-width: 0">
                  <div class="text-body-2 font-weight-medium text-truncate">{{ s.fullName }}</div>
                  <div class="text-caption text-medium-emphasis">{{ s.hemisId }}</div>
                </div>
                <v-chip v-if="addedIds.has(s.id)" size="x-small" variant="tonal" color="success">yangi</v-chip>
                <v-tooltip text="Talaba sifatida ochish" location="top">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-account-eye-outline"
                      size="small"
                      variant="text"
                      color="primary"
                      @click="viewAsStudent(s.fullName, s.hemisId)"
                    />
                  </template>
                </v-tooltip>
              </div>
            </div>
            <div class="pa-3 surface-sunken" style="border-radius: 0 0 var(--radius) var(--radius)">
              <v-text-field
                v-model="newStudent"
                density="compact"
                hide-details
                placeholder="F.I.O"
                class="mb-2"
                @keydown.enter="addStudent"
              />
              <v-text-field
                v-model="newStudentId"
                density="compact"
                hide-details
                placeholder="Hemis ID (ixtiyoriy)"
                class="mb-2"
                @keydown.enter="addStudent"
              />
              <v-btn size="small" block color="primary" variant="tonal" prepend-icon="mdi-plus" :disabled="!newStudent.trim()" @click="addStudent">
                Talaba qo‘shish
              </v-btn>
            </div>
          </template>
        </v-card>
      </v-col>
    </v-row>

    <v-alert v-if="selGroup" type="info" variant="tonal" density="comfortable" class="mt-4" icon="mdi-lightbulb-on-outline">
      Talaba qatoridagi
      <v-icon icon="mdi-account-eye-outline" size="16" class="mx-1" />
      tugmasi orqali o‘sha talaba sifatida tizimga kirib, unga tayinlangan testlarni tekshirishingiz mumkin.
      Keyin yuqoridagi banner orqali admin hisobiga qaytasiz.
    </v-alert>

    <v-dialog v-model="confirmReset" max-width="400">
      <v-card class="surface-card pa-6" rounded="lg">
        <div class="text-subtitle-1 font-weight-bold mb-2">Boshlang‘ich holatga qaytarish</div>
        <p class="text-body-2 text-medium-emphasis mb-5">
          Siz qo‘shgan barcha fakultet, guruh va talabalar o‘chiriladi.
        </p>
        <div class="d-flex justify-end" style="gap: 8px">
          <v-btn variant="text" @click="confirmReset = false">Bekor qilish</v-btn>
          <v-btn color="error" variant="flat" @click="doReset">Qaytarish</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="toastOpen" location="top end" color="success" timeout="2200">{{ toast }}</v-snackbar>
  </div>
</template>


<style scoped>
.pick-item.v-list-item--active {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}
.student-row {
  border-radius: var(--radius-sm);
}
.student-row + .student-row {
  border-top: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.6));
}
</style>
