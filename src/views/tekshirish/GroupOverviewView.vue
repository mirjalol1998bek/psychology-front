<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InstrumentResult from '@/components/psixologiya/InstrumentResult.vue'
import { useOrganizationStore } from '@/stores/organization'
import { usePassportStore, type PassportData } from '@/stores/passport'
import { mockGroupResults } from '@/utils/mockResults'
import { TEMPERAMENT_OPTIONS, SHAPE_OPTIONS } from '@/utils/instruments'
import { downloadCsv, fileSlug } from '@/utils/exportTable'

const route = useRoute()
const router = useRouter()
const org = useOrganizationStore()
const passport = usePassportStore()

const facultyId = route.params.facultyId as string
const groupId = route.params.groupId as string

const faculty = computed(() => org.facultyById(facultyId))
const group = computed(() => org.groupById(groupId))

const search = ref('')
const temperamentFilter = ref<string | null>(null)
const shapeFilter = ref<string | null>(null)
const showFilters = ref(false)

const allRows = computed(() => mockGroupResults(org.studentsForGroup(groupId)))

const rows = computed(() =>
  allRows.value.filter((r) => {
    if (search.value && !r.student.fullName.toLowerCase().includes(search.value.toLowerCase())) return false
    if (temperamentFilter.value && r.temperament !== temperamentFilter.value) return false
    if (shapeFilter.value && r.geometricFigure !== shapeFilter.value) return false
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

function exportCsv() {
  const headers = ['T/R', 'Talaba ID', 'F.I.O', 'Temperament', 'Psixogeometrik']
  const data = rows.value.map((r, i) => [
    i + 1,
    r.student.hemisId,
    r.student.fullName,
    r.temperament ?? 'Aniqlanmagan',
    r.geometricFigure ?? 'Aniqlanmagan',
  ])
  downloadCsv(fname('natijalar'), headers, data)
}

// Full socio-psychological passport table — columns match the official
// "Ijtimoiy-psixologik portret" xlsx template.
const FAMILY: Record<string, string> = { married: 'Uylangan / turmushga chiqqan', single: 'Uylanmagan / turmushga chiqmagan' }
const ENV: Record<string, string> = { calm: 'Tinch', problematic: 'Muammoli' }

function exportPassport() {
  const headers = [
    '№',
    'Talabaning F.I.O., tug‘ilgan sana',
    'Fakultet, kurs, guruh',
    'Hozirgi turar joyi, telefon',
    'Oilaviy ahvoli',
    'Alohida qobiliyat va iqtidori',
    'Temperament tipi',
    'Xarakteri (psixogeometrik)',
    'Oilaviy yashash muhiti',
    'Ota-onasi (F.I.O., tel, ish joyi)',
    'Biriktirilgan tyutor (F.I.O., tel)',
  ]
  const fg = `${faculty.value?.name ?? ''}, ${group.value?.name ?? ''}`
  const data = rows.value.map((r, i) => {
    const p: PassportData | null = passport.get(r.student.hemisId)
    return [
      i + 1,
      `${r.student.fullName}${p?.birthDate ? ', ' + p.birthDate : ''}`,
      fg,
      [p?.currentAddress, p?.phone].filter(Boolean).join(', '),
      p?.familyStatus ? FAMILY[p.familyStatus] : '',
      p?.talents ?? '',
      r.temperament ?? '',
      r.geometricFigure ?? '',
      p?.livingEnvironment ? ENV[p.livingEnvironment] : '',
      p?.parentsInfo ?? '',
      p?.tutorInfo ?? '',
    ]
  })
  downloadCsv(fname('pasport'), headers, data)
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
          Ijtimoiy-psixologik pasport
        </v-btn>
        <v-btn variant="tonal" color="success" prepend-icon="mdi-file-download-outline" :disabled="!rows.length" @click="exportCsv">
          Natijalar jadvali
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
            <td><InstrumentResult instrument="FREQUENCY_BASED" :value="r.temperament" /></td>
            <td><InstrumentResult instrument="RANKING_BASED" :value="r.geometricFigure" /></td>
          </tr>
        </tbody>
      </v-table>
      <v-empty-state v-if="!rows.length" icon="mdi-account-search-outline" title="Talaba topilmadi" density="compact" />
    </v-card>
  </div>
</template>
