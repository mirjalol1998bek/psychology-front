<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOrganizationStore, type HemisGroupOption } from '@/stores/organization'
import { useAuthStore } from '@/stores/auth'
import type { StudyLanguage } from '@/types/domain'

const org = useOrganizationStore()
const auth = useAuthStore()
const router = useRouter()

const selFacultyId = ref<string | null>(null)
const selGroupId = ref<string | null>(null)
const busy = ref(false)

org.load().then(() => {
  selFacultyId.value = org.faculties[0]?.id ?? null
})

const groups = computed(() => (selFacultyId.value ? org.groupsFor(selFacultyId.value) : []))
const selGroup = computed(() => groups.value.find((g) => g.id === selGroupId.value) ?? null)
const students = computed(() => (selGroupId.value ? org.studentsForGroup(selGroupId.value) : []))

// Reset the downstream selection whenever its parent changes.
watch(selFacultyId, () => {
  selGroupId.value = null
})
watch(selGroupId, (id) => {
  if (id) org.loadStudents(id)
})

// --- add forms -------------------------------------------------------------
const newFaculty = ref('')
const newGroup = ref('')
const newGroupLang = ref<StudyLanguage>('uz')
const newStudent = ref('')
const newStudentId = ref('')
const toast = ref('')
const toastOpen = ref(false)

const langOptions: { title: string; value: StudyLanguage }[] = [
  { title: 'O‘zbek', value: 'uz' },
  { title: 'Rus', value: 'ru' },
]

function notify(msg: string) {
  toast.value = msg
  toastOpen.value = true
}

async function addFaculty() {
  if (!newFaculty.value.trim() || busy.value) return
  busy.value = true
  try {
    const f = await org.addFaculty(newFaculty.value)
    newFaculty.value = ''
    selFacultyId.value = f.id
    notify('Fakultet qo‘shildi')
  } catch {
    notify('Xatolik — saqlanmadi')
  } finally {
    busy.value = false
  }
}

async function addGroup() {
  if (!selFacultyId.value || !newGroup.value.trim() || busy.value) return
  busy.value = true
  try {
    const g = await org.addGroup(selFacultyId.value, newGroup.value, newGroupLang.value)
    newGroup.value = ''
    selGroupId.value = g.id
    notify('Guruh qo‘shildi')
  } catch {
    notify('Xatolik — saqlanmadi')
  } finally {
    busy.value = false
  }
}

async function addStudent() {
  if (!selGroupId.value || !newStudent.value.trim() || busy.value) return
  busy.value = true
  try {
    await org.addStudent(selGroupId.value, newStudent.value, newStudentId.value)
    newStudent.value = ''
    newStudentId.value = ''
    notify('Talaba qo‘shildi')
  } catch {
    notify('Xatolik — HEMIS ID band bo‘lishi mumkin')
  } finally {
    busy.value = false
  }
}

async function viewAsStudent(studentId: string) {
  const ok = await auth.impersonateStudent(Number(studentId))
  if (ok) router.push('/tests')
  else notify('Talaba sifatida kirib bo‘lmadi')
}

// --- HEMIS sync ----------------------------------------------------------
const syncingFaculties = ref(false)
const syncingStudents = ref(false)
const hemisDialog = ref(false)
const hemisLoading = ref(false)
const hemisList = ref<HemisGroupOption[]>([])
const hemisSearch = ref('')
const importingId = ref<string | null>(null)

const selFaculty = computed(() => org.facultyById(selFacultyId.value ?? '') ?? null)
const importedExternalIds = computed(
  () => new Set(groups.value.map((g) => g.externalId).filter(Boolean) as string[]),
)
const hemisFiltered = computed(() => {
  const q = hemisSearch.value.trim().toLowerCase()
  return hemisList.value.filter((g) => !q || g.name.toLowerCase().includes(q)).slice(0, 200)
})

async function syncFaculties() {
  if (syncingFaculties.value) return
  syncingFaculties.value = true
  try {
    const c = await org.syncHemisFaculties()
    notify(`HEMIS: ${c.created} yangi, ${c.updated} yangilangan fakultet`)
  } catch {
    notify('HEMIS bilan bog‘lanib bo‘lmadi')
  } finally {
    syncingFaculties.value = false
  }
}

async function openHemisGroups() {
  if (!selFacultyId.value) return
  hemisDialog.value = true
  hemisSearch.value = ''
  hemisLoading.value = true
  hemisList.value = []
  try {
    hemisList.value = await org.hemisGroups(selFacultyId.value)
  } catch {
    notify('HEMIS guruhlarini olib bo‘lmadi')
    hemisDialog.value = false
  } finally {
    hemisLoading.value = false
  }
}

async function importGroup(opt: HemisGroupOption) {
  if (!selFacultyId.value || importingId.value) return
  importingId.value = opt.externalId
  try {
    const c = await org.importHemisGroup(selFacultyId.value, opt.externalId)
    notify(`${opt.name}: ${c.created + c.updated} talaba yuklandi`)
  } catch {
    notify('Import xatosi')
  } finally {
    importingId.value = null
  }
}

async function syncStudents() {
  if (!selGroupId.value || syncingStudents.value) return
  syncingStudents.value = true
  try {
    const c = await org.syncHemisStudents(selGroupId.value)
    notify(`HEMIS: ${c.created} yangi, ${c.updated} yangilangan talaba`)
  } catch {
    notify('Talabalarni yangilab bo‘lmadi')
  } finally {
    syncingStudents.value = false
  }
}
</script>

<template>
  <div>
    <div class="d-flex align-end justify-space-between page-head flex-wrap" style="gap: 12px">
      <div>
        <h1 class="text-h4">Tashkilot tuzilmasi</h1>
        <p class="text-body-2 text-medium-emphasis mb-0" style="max-width: 62ch">
          Fakultet, guruh va talabalarni HEMIS'dan yuklang yoki qo‘lda qo‘shing.
        </p>
      </div>
      <v-btn
        color="primary"
        variant="tonal"
        prepend-icon="mdi-cloud-download-outline"
        :loading="syncingFaculties"
        @click="syncFaculties"
      >
        HEMIS'dan fakultetlar
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
            <v-btn size="small" block color="primary" variant="tonal" prepend-icon="mdi-plus" :disabled="!newFaculty.trim() || busy" :loading="busy" @click="addFaculty">
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
              <v-btn
                v-if="selFaculty?.externalId"
                size="small"
                block
                color="primary"
                variant="flat"
                prepend-icon="mdi-cloud-download-outline"
                class="mb-3"
                @click="openHemisGroups"
              >
                HEMIS guruhidan tanlash
              </v-btn>
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
              <v-btn size="small" block color="primary" variant="tonal" prepend-icon="mdi-plus" :disabled="!newGroup.trim() || busy" :loading="busy" @click="addGroup">
                Qo‘lda guruh qo‘shish
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
            <div class="d-flex align-center" style="gap: 4px">
              <v-tooltip v-if="selGroup?.externalId" text="HEMIS'dan yangilash" location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-cloud-refresh-outline"
                    size="x-small"
                    variant="text"
                    color="primary"
                    :loading="syncingStudents"
                    @click="syncStudents"
                  />
                </template>
              </v-tooltip>
              <v-chip size="x-small" variant="tonal">{{ students.length }}</v-chip>
            </div>
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
                <v-tooltip text="Talaba sifatida ochish" location="top">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-account-eye-outline"
                      size="small"
                      variant="text"
                      color="primary"
                      @click="viewAsStudent(s.id)"
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
              <v-btn size="small" block color="primary" variant="tonal" prepend-icon="mdi-plus" :disabled="!newStudent.trim() || busy" :loading="busy" @click="addStudent">
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

    <v-dialog v-model="hemisDialog" max-width="520" scrollable>
      <v-card class="surface-card" rounded="lg">
        <div class="px-5 pt-5 pb-2">
          <div class="text-subtitle-1 font-weight-bold">HEMIS guruhlari</div>
          <p class="text-caption text-medium-emphasis mb-3">
            {{ selFaculty?.name }} — guruhni tanlang, talabalari ham yuklanadi.
          </p>
          <v-text-field
            v-model="hemisSearch"
            density="compact"
            variant="solo-filled"
            flat
            hide-details
            rounded="lg"
            bg-color="surface-variant"
            prepend-inner-icon="mdi-magnify"
            placeholder="Guruh nomi bo‘yicha qidirish..."
          />
        </div>
        <v-divider />
        <div style="max-height: 55vh; overflow-y: auto">
          <div v-if="hemisLoading" class="pa-8 text-center">
            <v-progress-circular indeterminate color="primary" />
          </div>
          <v-list v-else density="comfortable" bg-color="transparent">
            <v-list-item v-for="opt in hemisFiltered" :key="opt.externalId" class="px-4">
              <v-list-item-title class="text-body-2 font-weight-medium">{{ opt.name }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">{{ opt.studyLanguage === 'ru' ? 'Rus' : 'O‘zbek' }}</v-list-item-subtitle>
              <template #append>
                <v-chip v-if="importedExternalIds.has(opt.externalId)" size="x-small" color="success" variant="tonal" prepend-icon="mdi-check">
                  Yuklangan
                </v-chip>
                <v-btn
                  v-else
                  size="small"
                  variant="tonal"
                  color="primary"
                  :loading="importingId === opt.externalId"
                  :disabled="importingId !== null"
                  @click="importGroup(opt)"
                >
                  Yuklash
                </v-btn>
              </template>
            </v-list-item>
            <div v-if="!hemisFiltered.length" class="pa-6 text-center text-caption text-medium-emphasis">
              Guruh topilmadi
            </div>
          </v-list>
        </div>
        <v-divider />
        <div class="pa-3 d-flex justify-end">
          <v-btn variant="text" @click="hemisDialog = false">Yopish</v-btn>
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
