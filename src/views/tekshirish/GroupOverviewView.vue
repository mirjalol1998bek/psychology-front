<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InstrumentResult from '@/components/psixologiya/InstrumentResult.vue'
import { useOrganizationStore } from '@/stores/organization'
import type { PassportData } from '@/stores/passport'
import { fetchGroupOverview, type GroupRow } from '@/services/groupReport'
import { TEMPERAMENT_OPTIONS, SHAPE_OPTIONS } from '@/utils/instruments'
import { downloadXlsx, fileSlug } from '@/utils/exportXlsx'

const route = useRoute()
const router = useRouter()
const org = useOrganizationStore()

const facultyId = route.params.facultyId as string
const groupId = route.params.groupId as string
org.load().then(() => org.loadGroups(facultyId))

const faculty = computed(() => org.facultyById(facultyId))
const group = computed(() => org.groupById(groupId))

const search = ref('')
const temperamentFilter = ref<string | null>(null)
const shapeFilter = ref<string | null>(null)
const showFilters = ref(false)
const loading = ref(true)
const allRows = ref<GroupRow[]>([])

async function load() {
  loading.value = true
  try {
    await org.load()
    await org.loadGroups(facultyId)
    allRows.value = await fetchGroupOverview(groupId, group.value?.studyLanguage ?? 'uz')
  } catch {
    allRows.value = []
  } finally {
    loading.value = false
  }
}
load()
watch(group, (g, prev) => {
  if (g && !prev) load()
})

const rows = computed(() =>
  allRows.value.filter((r) => {
    if (search.value && !r.fullName.toLowerCase().includes(search.value.toLowerCase())) return false
    if (temperamentFilter.value && r.temperament !== temperamentFilter.value) return false
    if (shapeFilter.value && r.figure !== shapeFilter.value) return false
    return true
  }),
)

function resetFilters() {
  temperamentFilter.value = null
  shapeFilter.value = null
  search.value = ''
}

const fname = (suffix: string) =>
  `${fileSlug(faculty.value?.name ?? '')}_${fileSlug(group.value?.name ?? 'guruh')}_${suffix}`

function exportResults() {
  const headers = ['T/R', 'Talaba ID', 'F.I.SH', 'Temperament', 'Psixogeometrik']
  const data = rows.value.map((r, i) => [
    i + 1,
    r.hemisId ?? '',
    r.fullName,
    r.temperament ?? 'Aniqlanmagan',
    r.figure ?? 'Aniqlanmagan',
  ])
  downloadXlsx(fname('natijalar'), 'Natijalar', headers, data)
}

// "Ijtimoiy-psixologik anketa" — har bir maydon alohida ustunda, shundagina
// Excelda saralash/filtrlash ishlaydi.
const GENDER: Record<string, string> = { male: 'Erkak', female: 'Ayol' }
const LIVING: Record<string, string> = {
  with_family: 'Oila bilan',
  dormitory: 'Talabalar turar joyida',
  rented: 'Ijarada',
  with_relatives: 'Qarindoshlarnikida',
}
const FAMILY: Record<string, string> = { married: 'Turmush qurgan', single: 'Turmush qurmagan' }
const FAMILY_TYPE: Record<string, string> = {
  full: 'To‘liq',
  incomplete: 'To‘liqsiz',
  under_guardianship: 'Vasiylikda',
  lost_breadwinner: 'Boquvchisini yo‘qotgan',
}
const FINANCIAL: Record<string, string> = { good: 'Yaxshi', average: 'O‘rtacha', difficult: 'Qiyin' }
const EDUCATION_FORM: Record<string, string> = { budget: 'Byudjet', contract: 'To‘lov-kontrakt', grant: 'Grant' }
const WORK_STATUS: Record<string, string> = { no: 'Yo‘q', partial: 'Qisman', full_time: 'Doimiy' }

function ageFrom(birthDate: string): string {
  if (!birthDate) return ''
  const b = new Date(birthDate)
  if (Number.isNaN(b.getTime())) return ''
  const now = new Date()
  let years = now.getFullYear() - b.getFullYear()
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) years--
  return years >= 0 ? String(years) : ''
}

function exportPassport() {
  const headers = [
    'T/R',
    'Shaxsiy kod',
    'F.I.SH',
    'Fakultet',
    'Guruh',
    'Tug‘ilgan sana',
    'Yoshi',
    'Jinsi',
    'Doimiy yashash manzili',
    'Hozir qayerda yashaydi',
    'Yo‘lda ketadigan vaqt (daqiqa)',
    'Oilaviy holati',
    'Oila tipi',
    'Farzandlar soni',
    'Nechanchi farzand',
    'Otasining ma’lumoti va kasbi',
    'Onasining ma’lumoti va kasbi',
    'Moddiy ahvoli',
    'Ta’lim shakli',
    'Ishlaydimi',
    'Universitetgacha tugatgan muassasa',
    'O‘rtacha bahosi',
    'Chet tili darajasi',
    'To‘garak / faoliyat',
    'Bo‘sh vaqt',
    'Sog‘liq cheklovlari',
    'Ilgari psixologga murojaat',
    'Hozirgi tashvishi',
    'Temperament tipi',
    'Xarakteri (psixogeometrik)',
  ]
  const data = rows.value.map((r, i) => {
    const p: PassportData | null = r.passport
    return [
      i + 1,
      r.personalCode ?? '',
      r.fullName,
      faculty.value?.name ?? '',
      group.value?.name ?? '',
      p?.birthDate ?? '',
      p?.birthDate ? ageFrom(p.birthDate) : '',
      p?.gender ? GENDER[p.gender] : '',
      p?.permanentAddress ?? '',
      p?.livingArrangement ? LIVING[p.livingArrangement] : '',
      p?.commuteMinutes ?? '',
      p?.familyStatus ? FAMILY[p.familyStatus] : '',
      p?.familyType ? FAMILY_TYPE[p.familyType] : '',
      p?.siblingsCount ?? '',
      p?.birthOrder ?? '',
      p?.fatherInfo ?? '',
      p?.motherInfo ?? '',
      p?.financialStatus ? FINANCIAL[p.financialStatus] : '',
      p?.educationForm ? EDUCATION_FORM[p.educationForm] : '',
      p?.workStatus ? WORK_STATUS[p.workStatus] : '',
      p?.priorEducation ?? '',
      p?.gpaScore ?? '',
      p?.languageLevel ?? '',
      p?.extracurricular ?? '',
      p?.leisureActivity ?? '',
      p?.healthLimitations ?? '',
      p?.priorPsychologistVisit === true ? 'Ha' : p?.priorPsychologistVisit === false ? 'Yo‘q' : '',
      p?.currentConcern ?? '',
      r.temperament ?? '',
      r.figure ?? '',
    ]
  })
  downloadXlsx(fname('anketa'), 'Ijtimoiy-psixologik anketa', headers, data)
}
</script>

<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-3" @click="router.push('/tekshirish')">Orqaga</v-btn>

    <div class="d-flex align-end justify-space-between page-head flex-wrap" style="gap: 12px">
      <div>
        <h1 class="text-h4">{{ group?.name }}</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">{{ faculty?.name }} · {{ group?.studentCount }} talaba</p>
      </div>
      <div class="d-flex flex-wrap" style="gap: 8px">
        <v-btn variant="tonal" color="secondary" prepend-icon="mdi-card-account-details-outline" :disabled="!rows.length" @click="exportPassport">
          Anketa (Excel)
        </v-btn>
        <v-btn variant="tonal" color="success" prepend-icon="mdi-microsoft-excel" :disabled="!rows.length" @click="exportResults">
          Natijalar (Excel)
        </v-btn>
      </div>
    </div>

    <v-card class="surface-card pa-4" rounded="lg">
      <div class="d-flex flex-wrap align-center mb-4" style="gap: 12px">
        <v-text-field
          v-model="search"
          density="compact"
          variant="solo-filled"
          rounded="lg"
          hide-details
          flat
          bg-color="surface-variant"
          prepend-inner-icon="mdi-magnify"
          placeholder="Talaba qidirish..."
          style="max-width: 260px"
          class="app-search"
        />
        <v-btn variant="tonal" color="secondary" prepend-icon="mdi-filter-variant" @click="showFilters = !showFilters">
          Filter
        </v-btn>
        <v-btn v-if="temperamentFilter || shapeFilter || search" variant="text" size="small" @click="resetFilters">
          Tozalash
        </v-btn>
      </div>

      <v-expand-transition>
        <v-row v-if="showFilters" class="mb-2">
          <v-col cols="12" sm="6" md="4">
            <v-select v-model="temperamentFilter" :items="TEMPERAMENT_OPTIONS" label="Temperament" clearable hide-details density="comfortable" />
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-select v-model="shapeFilter" :items="SHAPE_OPTIONS" label="Psixogeometrik shakl" clearable hide-details density="comfortable" />
          </v-col>
        </v-row>
      </v-expand-transition>

      <v-table class="mt-2">
        <thead>
          <tr>
            <th>T/R</th>
            <th>Talaba ID</th>
            <th>F.I.O</th>
            <th>Temperament</th>
            <th>Psixogeometrik</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in rows" :key="r.studentId">
            <td>{{ i + 1 }}</td>
            <td class="text-medium-emphasis">{{ r.hemisId }}</td>
            <td>
              <div class="d-flex align-center py-2" style="gap: 10px">
                <v-avatar size="30" color="primary" variant="tonal">
                  <span class="text-caption font-weight-bold">{{ r.fullName[0] }}</span>
                </v-avatar>
                {{ r.fullName }}
              </div>
            </td>
            <td><InstrumentResult instrument="FREQUENCY_BASED" :value="r.temperament" /></td>
            <td><InstrumentResult instrument="RANKING_BASED" :value="r.figure" /></td>
          </tr>
        </tbody>
      </v-table>
      <div v-if="loading" class="d-flex justify-center py-10"><v-progress-circular indeterminate color="primary" /></div>
      <v-empty-state v-else-if="!rows.length" icon="mdi-account-search-outline" title="Talaba topilmadi" density="compact" />
    </v-card>
  </div>
</template>
