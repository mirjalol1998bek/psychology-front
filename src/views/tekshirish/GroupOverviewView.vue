<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InstrumentResult from '@/components/psixologiya/InstrumentResult.vue'
import { useOrganizationStore } from '@/stores/organization'
import type { PassportData } from '@/stores/passport'
import { fetchGroupOverview, type GroupRow, type ResultCell } from '@/services/groupReport'
import { TEMPERAMENT_OPTIONS, SHAPE_OPTIONS, INSTRUMENT_META, instrumentLabel, splitTypes, formatTypes } from '@/utils/instruments'
import type { InstrumentType } from '@/types/domain'
import { SUBSCALE_ONLY } from '@/types/assessment'
import { downloadXlsx, fileSlug } from '@/utils/exportXlsx'
import {
  GENDER,
  LIVING,
  FAMILY,
  FAMILY_TYPE,
  FINANCIAL,
  EDUCATION_FORM,
  WORK_STATUS,
  ageFrom,
  yesNo,
} from '@/utils/passportFields'

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
const instruments = ref<InstrumentType[]>([])

async function load() {
  loading.value = true
  try {
    await org.load()
    await org.loadGroups(facultyId)
    const overview = await fetchGroupOverview(groupId, group.value?.studyLanguage ?? 'uz')
    allRows.value = overview.rows
    instruments.value = overview.instruments
  } catch {
    allRows.value = []
  } finally {
    loading.value = false
  }
}

/** Temperament/psixogeometrik — tur chipi; qolganlari — xulosa nomi va ball. */
const TYPE_INSTRUMENTS: InstrumentType[] = ['FREQUENCY_BASED', 'RANKING_BASED']

function cellText(cell: ResultCell | undefined): string {
  if (!cell) return ''
  // KSM-20 kabi umumiy balli bo'lmagan metodika — natija faqat subshkalalarda.
  if (cell.resultKey === SUBSCALE_ONLY) return 'Topshirgan'
  return cell.score != null ? `${cell.label} · ${cell.score}` : cell.label
}
load()
watch(group, (g, prev) => {
  if (g && !prev) load()
})

const rows = computed(() =>
  allRows.value.filter((r) => {
    if (search.value && !r.fullName.toLowerCase().includes(search.value.toLowerCase())) return false
    // Aralash natija (Flegmatik+Xolerik) har bir turi bo'yicha filtrda chiqadi.
    if (temperamentFilter.value && !splitTypes(r.temperament).includes(temperamentFilter.value)) return false
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
  const headers = ['T/R', 'Talaba ID', 'F.I.SH', ...instruments.value.map((ins) => instrumentLabel(ins))]
  const data = rows.value.map((r, i) => [
    i + 1,
    r.hemisId ?? '',
    r.fullName,
    ...instruments.value.map((ins) => cellText(r.results[ins]) || 'Topshirmagan'),
  ])
  downloadXlsx(fname('natijalar'), 'Natijalar', headers, data)
}

// "Ijtimoiy-psixologik anketa" — har bir maydon alohida ustunda, shundagina
// Excelda saralash/filtrlash ishlaydi.
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
      p ? yesNo(p.priorPsychologistVisit) : '',
      p?.currentConcern ?? '',
      formatTypes(r.temperament),
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

      <v-table class="mt-2 overview-table">
        <thead>
          <tr>
            <th>T/R</th>
            <th>Talaba ID</th>
            <th class="name-col">F.I.O</th>
            <th v-for="ins in instruments" :key="ins" class="text-no-wrap">
              <span class="d-inline-flex align-center" style="gap: 6px">
                <v-icon :icon="INSTRUMENT_META[ins].icon" size="15" :style="{ color: INSTRUMENT_META[ins].tint }" />
                {{ instrumentLabel(ins) }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in rows" :key="r.studentId">
            <td>{{ i + 1 }}</td>
            <td class="text-medium-emphasis">{{ r.hemisId }}</td>
            <td class="name-col">
              <div class="d-flex align-center py-2" style="gap: 10px">
                <v-avatar size="30" color="primary" variant="tonal">
                  <span class="text-caption font-weight-bold">{{ r.fullName[0] }}</span>
                </v-avatar>
                {{ r.fullName }}
              </div>
            </td>
            <td v-for="ins in instruments" :key="ins">
              <InstrumentResult v-if="TYPE_INSTRUMENTS.includes(ins)" :instrument="ins" :value="r.results[ins]?.resultKey ?? null" />
              <span v-else-if="!r.results[ins]" class="text-medium-emphasis">—</span>
              <span v-else class="result-chip" :style="{ '--tint': INSTRUMENT_META[ins].tint }" :title="cellText(r.results[ins])">
                {{ cellText(r.results[ins]) }}
              </span>
            </td>
          </tr>
        </tbody>
      </v-table>
      <div v-if="loading" class="d-flex justify-center py-10"><v-progress-circular indeterminate color="primary" /></div>
      <v-empty-state v-else-if="!rows.length" icon="mdi-account-search-outline" title="Talaba topilmadi" density="compact" />
    </v-card>
  </div>
</template>

<style scoped>
.overview-table :deep(th),
.overview-table :deep(td) {
  white-space: nowrap;
}

/* F.I.O ustuni gorizontal aylantirishda ko'rinib tursin. */
.overview-table :deep(.name-col) {
  position: sticky;
  left: 0;
  z-index: 1;
  background: rgb(var(--v-theme-surface));
}

.result-chip {
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 0.78rem;
  font-weight: 600;
  background: color-mix(in srgb, var(--tint) 14%, transparent);
  color: var(--tint);
}
</style>
