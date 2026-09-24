<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrganizationStore } from '@/stores/organization'
import { completeness } from '@/stores/passport'
import { fetchGroupPassports, type GroupPassport } from '@/services/groupReport'
import { passportSections } from '@/utils/passportFields'
import { downloadPassportPdf, type PassportPdfInput } from '@/utils/passportPdf'
import { formatDay } from '@/utils/datetime'
import { fileSlug } from '@/utils/exportXlsx'
import { usePassportZip } from '@/composables/usePassportZip'
import PassportZipDialog from '@/components/psixologiya/PassportZipDialog.vue'
import type { StudentDto } from '@/types/domain'

const route = useRoute()
const router = useRouter()
const org = useOrganizationStore()

const facultyId = route.params.facultyId as string
const groupId = route.params.groupId as string
org.load().then(() => org.loadGroups(facultyId))

const faculty = computed(() => org.facultyById(facultyId))
const group = computed(() => org.groupById(groupId))

const loading = ref(true)
const passports = ref(new Map<number, GroupPassport>())
const toast = ref('')

async function load() {
  loading.value = true
  try {
    const [, byStudent] = await Promise.all([org.loadStudents(groupId, true), fetchGroupPassports(groupId)])
    passports.value = byStudent
  } catch {
    toast.value = 'Ma’lumotlarni yuklab bo‘lmadi'
  } finally {
    loading.value = false
  }
}
load()

interface Row {
  student: StudentDto
  entry: GroupPassport | null
  pct: number
}

const allRows = computed<Row[]>(() =>
  org
    .studentsForGroup(groupId)
    .map((student) => {
      const entry = passports.value.get(Number(student.id)) ?? null
      return { student, entry, pct: completeness(entry?.passport ?? null) }
    })
    .sort((a, b) => a.student.fullName.localeCompare(b.student.fullName)),
)
const filledCount = computed(() => allRows.value.filter((r) => r.entry).length)
const coverage = computed(() => (allRows.value.length ? Math.round((filledCount.value / allRows.value.length) * 100) : 0))

type Status = 'all' | 'filled' | 'empty'
const status = ref<Status>('all')
const search = ref('')

const rows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return allRows.value.filter((r) => {
    if (status.value === 'filled' && !r.entry) return false
    if (status.value === 'empty' && r.entry) return false
    return !q || r.student.fullName.toLowerCase().includes(q) || r.student.hemisId.includes(q)
  })
})

const viewing = ref<Row | null>(null)
const sections = computed(() => (viewing.value?.entry ? passportSections(viewing.value.entry.passport) : []))

function pdfInput(r: Row, entry: GroupPassport): PassportPdfInput {
  return {
    fullName: r.student.fullName,
    hemisId: r.student.hemisId,
    faculty: faculty.value?.name ?? '',
    group: group.value?.name ?? '',
    personalCode: entry.personalCode,
    passport: entry.passport,
  }
}

const downloadingId = ref<string | null>(null)
async function downloadPdf(r: Row) {
  if (!r.entry || downloadingId.value) return
  downloadingId.value = r.student.id
  try {
    await downloadPassportPdf(pdfInput(r, r.entry))
  } catch {
    toast.value = 'PDF yaratib bo‘lmadi'
  } finally {
    downloadingId.value = null
  }
}

const zip = usePassportZip()
async function downloadGroupZip() {
  const items = allRows.value.flatMap((r) => (r.entry ? [{ input: pdfInput(r, r.entry) }] : []))
  await zip.run(async () => items, `pasportlar_${fileSlug(faculty.value?.name ?? '')}_${fileSlug(group.value?.name ?? 'guruh')}`)
  if (zip.message.value) toast.value = zip.message.value
}

function updatedLabel(r: Row): string {
  return r.entry?.passport.updatedAt ? formatDay(r.entry.passport.updatedAt, { year: true }) : ''
}
</script>

<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-3" @click="router.push('/passports')">Orqaga</v-btn>

    <div class="d-flex align-end justify-space-between page-head flex-wrap" style="gap: 12px">
      <div>
        <h1 class="text-h4">{{ group?.name }} — pasportlar</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">{{ faculty?.name }} · {{ allRows.length }} talaba</p>
      </div>
      <v-btn
        variant="tonal"
        color="secondary"
        prepend-icon="mdi-folder-zip-outline"
        :disabled="!filledCount || zip.active.value"
        @click="downloadGroupZip"
      >
        Guruh arxivi (ZIP · {{ filledCount }} ta PDF)
      </v-btn>
    </div>

    <v-row class="mb-1" dense>
      <v-col cols="4">
        <v-card class="surface-card stat-card h-100" rounded="lg">
          <div class="stat-label text-medium-emphasis">To‘ldirgan</div>
          <div class="stat-value text-display" style="color: rgb(var(--v-theme-success))">{{ filledCount }}</div>
        </v-card>
      </v-col>
      <v-col cols="4">
        <v-card class="surface-card stat-card h-100" rounded="lg">
          <div class="stat-label text-medium-emphasis">To‘ldirmagan</div>
          <div class="stat-value text-display" style="color: rgb(var(--v-theme-warning))">{{ allRows.length - filledCount }}</div>
        </v-card>
      </v-col>
      <v-col cols="4">
        <v-card class="surface-card stat-card h-100" rounded="lg">
          <div class="stat-label text-medium-emphasis">Qamrov</div>
          <div class="stat-value text-display" style="color: rgb(var(--v-theme-primary))">{{ coverage }}%</div>
          <v-progress-linear :model-value="coverage" height="6" rounded color="primary" bg-color="surface-variant" class="mt-2" />
        </v-card>
      </v-col>
    </v-row>

    <v-card class="surface-card pa-4" rounded="lg">
      <div class="d-flex flex-wrap align-center mb-3" style="gap: 12px">
        <v-text-field
          v-model="search"
          density="compact"
          variant="solo-filled"
          rounded="lg"
          hide-details
          flat
          bg-color="surface-variant"
          prepend-inner-icon="mdi-magnify"
          placeholder="Ism yoki Talaba ID..."
          style="max-width: 260px"
          class="app-search"
        />
        <v-btn-toggle v-model="status" mandatory density="comfortable" rounded="lg" variant="outlined" color="primary">
          <v-btn value="all" size="small">Hammasi</v-btn>
          <v-btn value="filled" size="small">To‘ldirgan</v-btn>
          <v-btn value="empty" size="small">To‘ldirmagan</v-btn>
        </v-btn-toggle>
      </div>

      <v-table>
        <thead>
          <tr>
            <th>T/R</th>
            <th>Talaba ID</th>
            <th>F.I.SH</th>
            <th>Anketa</th>
            <th>Yangilangan</th>
            <th class="text-right">Amallar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in rows" :key="r.student.id">
            <td>{{ i + 1 }}</td>
            <td class="text-medium-emphasis">{{ r.student.hemisId }}</td>
            <td>
              <div class="d-flex align-center py-2" style="gap: 10px">
                <v-avatar size="30" color="primary" variant="tonal">
                  <span class="text-caption font-weight-bold">{{ r.student.fullName[0] }}</span>
                </v-avatar>
                {{ r.student.fullName }}
              </div>
            </td>
            <td>
              <v-chip v-if="!r.entry" size="small" variant="tonal" color="warning" prepend-icon="mdi-clock-outline">To‘ldirilmagan</v-chip>
              <v-chip v-else-if="r.pct === 100" size="small" variant="tonal" color="success" prepend-icon="mdi-check-circle-outline">To‘liq</v-chip>
              <v-chip v-else size="small" variant="tonal" color="info" prepend-icon="mdi-progress-check">{{ r.pct }}% to‘ldirilgan</v-chip>
            </td>
            <td class="text-medium-emphasis">{{ updatedLabel(r) || '—' }}</td>
            <td class="text-right text-no-wrap">
              <template v-if="r.entry">
                <v-btn size="small" variant="text" color="primary" prepend-icon="mdi-eye-outline" @click="viewing = r">Ko‘rish</v-btn>
                <v-btn
                  size="small"
                  variant="tonal"
                  color="secondary"
                  prepend-icon="mdi-file-pdf-box"
                  :loading="downloadingId === r.student.id"
                  @click="downloadPdf(r)"
                >
                  PDF
                </v-btn>
              </template>
            </td>
          </tr>
        </tbody>
      </v-table>
      <div v-if="loading" class="d-flex justify-center py-10"><v-progress-circular indeterminate color="primary" /></div>
      <v-empty-state v-else-if="!rows.length" icon="mdi-account-search-outline" title="Talaba topilmadi" density="compact" />
    </v-card>

    <v-dialog :model-value="viewing !== null" max-width="760" scrollable @update:model-value="(v) => !v && (viewing = null)">
      <v-card v-if="viewing" rounded="lg">
        <v-card-title class="d-flex align-start pa-5 pb-3" style="gap: 12px">
          <div class="flex-grow-1" style="min-width: 0">
            <div class="text-display font-weight-bold passport-name">{{ viewing.student.fullName }}</div>
            <div class="passport-meta text-medium-emphasis mt-1">
              {{ viewing.student.hemisId }} · {{ group?.name }} · {{ faculty?.name }}
              <template v-if="viewing.entry?.personalCode"> · Shaxsiy kod: {{ viewing.entry.personalCode }}</template>
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="viewing = null" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-5">
          <section v-for="s in sections" :key="s.title" class="mb-5">
            <div class="section-title">{{ s.title }}</div>
            <div v-for="[label, value] in s.rows" :key="label" class="passport-row">
              <div class="passport-label">{{ label }}</div>
              <div class="passport-value" :class="{ 'text-disabled': !value }">{{ value || '—' }}</div>
            </div>
          </section>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <span class="text-caption text-medium-emphasis d-none d-sm-inline">Yangilangan: {{ updatedLabel(viewing) || '—' }}</span>
          <v-spacer />
          <v-btn variant="text" @click="viewing = null">Yopish</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-file-pdf-box"
            :loading="downloadingId === viewing.student.id"
            @click="downloadPdf(viewing)"
          >
            PDF yuklab olish
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <PassportZipDialog
      :active="zip.active.value"
      :done="zip.done.value"
      :total="zip.total.value"
      :title="`${group?.name ?? 'Guruh'} — pasportlar arxivi`"
      @cancel="zip.cancel"
    />

    <v-snackbar :model-value="!!toast" color="error" timeout="3500" @update:model-value="toast = ''">{{ toast }}</v-snackbar>
  </div>
</template>

<style scoped>
.stat-card {
  padding: 16px;
}
.stat-label {
  font-size: 0.8rem;
  margin-bottom: 4px;
}
.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.15;
}

@media (max-width: 599px) {
  .stat-card {
    padding: 12px 10px;
  }
  .stat-label {
    font-size: 0.7rem;
  }
  .stat-value {
    font-size: 1.35rem;
  }
}

.passport-name {
  font-size: 1.25rem;
  line-height: 1.3;
  white-space: normal;
}

.passport-meta {
  font-size: 0.85rem;
  font-weight: 400;
  line-height: 1.4;
  white-space: normal;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-primary));
  margin-bottom: 6px;
}

.passport-row {
  display: grid;
  grid-template-columns: minmax(160px, 38%) 1fr;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.passport-row:last-child {
  border-bottom: none;
}

.passport-label {
  font-size: 0.85rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.passport-value {
  font-size: 0.9rem;
  white-space: pre-line;
  word-break: break-word;
}

@media (max-width: 599px) {
  .passport-row {
    grid-template-columns: 1fr;
    gap: 2px;
  }
}
</style>
