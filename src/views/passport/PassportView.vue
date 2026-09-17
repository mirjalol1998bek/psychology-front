<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { usePassportStore, emptyPassport, completeness, type PassportData } from '@/stores/passport'
import { getAttempts } from '@/services/attemptService'
import { instrumentLabel } from '@/utils/instruments'
import type { StoredAttempt } from '@/types/assessment'

const { t } = useI18n()
const auth = useAuthStore()
const store = usePassportStore()

const studentKey = computed(() => auth.user?.hemis.hemisId ?? 'anon')

const form = reactive<PassportData>({ ...emptyPassport() })
const saved = ref(false)
const saving = ref(false)
const pct = computed(() => completeness(form))

store.load().then(() => {
  Object.assign(form, store.get(studentKey.value) ?? emptyPassport())
})

/** Anketa `birthDate`dan hisoblanadi — backendda saqlanmaydi. */
const age = computed<number | null>(() => {
  if (!form.birthDate) return null
  const b = new Date(form.birthDate)
  if (Number.isNaN(b.getTime())) return null
  const now = new Date()
  let years = now.getFullYear() - b.getFullYear()
  const beforeBirthdayThisYear = now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())
  if (beforeBirthdayThisYear) years--
  return years >= 0 ? years : null
})

// Test-derived fields (read-only here — filled by the psychologist's export).
const attempts = ref<StoredAttempt[]>([])
getAttempts(studentKey.value).then((a) => (attempts.value = a))
const resultOf = (i: 'FREQUENCY_BASED' | 'RANKING_BASED') =>
  attempts.value.find((x) => x.instrumentType === i && x.status === 'submitted')?.result?.label ?? null

watch(
  form,
  () => {
    saved.value = false
  },
  { deep: true },
)

async function submit() {
  if (saving.value) return
  saving.value = true
  try {
    await store.save(studentKey.value, { ...form })
    saved.value = true
    setTimeout(() => (saved.value = false), 2500)
  } finally {
    saving.value = false
  }
}

const genderOpts = [
  { value: 'male', label: 'passport.genderMale' },
  { value: 'female', label: 'passport.genderFemale' },
]
const livingArrangementOpts = [
  { value: 'with_family', label: 'passport.livingWithFamily' },
  { value: 'dormitory', label: 'passport.livingDormitory' },
  { value: 'rented', label: 'passport.livingRented' },
  { value: 'with_relatives', label: 'passport.livingWithRelatives' },
]
const familyStatusOpts = [
  { value: 'single', label: 'passport.familyStatusSingle' },
  { value: 'married', label: 'passport.familyStatusMarried' },
]
const familyTypeOpts = [
  { value: 'full', label: 'passport.familyTypeFull' },
  { value: 'incomplete', label: 'passport.familyTypeIncomplete' },
  { value: 'under_guardianship', label: 'passport.familyTypeUnderGuardianship' },
  { value: 'lost_breadwinner', label: 'passport.familyTypeLostBreadwinner' },
]
const financialStatusOpts = [
  { value: 'good', label: 'passport.financialGood' },
  { value: 'average', label: 'passport.financialAverage' },
  { value: 'difficult', label: 'passport.financialDifficult' },
]
const educationFormOpts = [
  { value: 'budget', label: 'passport.educationBudget' },
  { value: 'contract', label: 'passport.educationContract' },
  { value: 'grant', label: 'passport.educationGrant' },
]
const workStatusOpts = [
  { value: 'no', label: 'passport.workNo' },
  { value: 'partial', label: 'passport.workPartial' },
  { value: 'full_time', label: 'passport.workFullTime' },
]
</script>

<template>
  <div>
    <header class="page-head">
      <h1 class="text-h4">{{ t('passport.title') }}</h1>
      <p class="text-body-2 text-medium-emphasis mb-0" style="max-width: 64ch">
        {{ t('passport.subtitle') }}
      </p>
    </header>

    <v-row>
      <v-col cols="12" lg="8">
        <v-card class="surface-card pa-5 pa-md-6" rounded="lg">
          <div class="text-subtitle-2 font-weight-bold text-uppercase text-medium-emphasis mb-3">
            {{ t('passport.personalData') }}
          </div>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="auth.user?.hemis.fullName"
                :label="t('passport.fio')"
                readonly
                variant="filled"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="`${auth.user?.hemis.faculty} · ${auth.user?.hemis.group}`"
                :label="t('passport.facultyGroup')"
                readonly
                variant="filled"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.birthDate"
                type="date"
                :label="t('passport.birthDate')"
                :hint="age !== null ? t('passport.age', { n: age }) : undefined"
                persistent-hint
              />
            </v-col>
          </v-row>
          <div class="text-caption font-weight-bold text-medium-emphasis mb-1 mt-2">{{ t('passport.gender') }}</div>
          <v-radio-group v-model="form.gender" inline hide-details class="mb-1">
            <v-radio v-for="o in genderOpts" :key="o.value" :value="o.value" :label="t(o.label)" />
          </v-radio-group>

          <v-divider class="my-5" />

          <div class="text-subtitle-2 font-weight-bold text-uppercase text-medium-emphasis mb-3">
            {{ t('passport.living') }}
          </div>
          <v-text-field v-model="form.permanentAddress" :label="t('passport.permanentAddress')" class="mb-1" />
          <div class="text-caption font-weight-bold text-medium-emphasis mb-1">{{ t('passport.livingArrangement') }}</div>
          <v-radio-group v-model="form.livingArrangement" inline hide-details class="mb-3">
            <v-radio v-for="o in livingArrangementOpts" :key="o.value" :value="o.value" :label="t(o.label)" />
          </v-radio-group>
          <v-text-field
            v-model="form.commuteMinutes"
            type="number"
            min="0"
            :label="t('passport.commuteMinutes')"
            style="max-width: 260px"
          />

          <v-divider class="my-5" />

          <div class="text-subtitle-2 font-weight-bold text-uppercase text-medium-emphasis mb-3">
            {{ t('passport.family') }}
          </div>
          <div class="text-caption font-weight-bold text-medium-emphasis mb-1">{{ t('passport.familyStatus') }}</div>
          <v-radio-group v-model="form.familyStatus" inline hide-details class="mb-3">
            <v-radio v-for="o in familyStatusOpts" :key="o.value" :value="o.value" :label="t(o.label)" />
          </v-radio-group>

          <v-select
            v-model="form.familyType"
            :items="familyTypeOpts.map((o) => ({ ...o, title: t(o.label) }))"
            item-title="title"
            item-value="value"
            :label="t('passport.familyType')"
            density="comfortable"
            class="mb-1"
          />
          <v-row dense>
            <v-col cols="6">
              <v-text-field v-model="form.siblingsCount" type="number" min="0" :label="t('passport.siblingsCount')" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="form.birthOrder" type="number" min="0" :label="t('passport.birthOrder')" />
            </v-col>
          </v-row>
          <v-text-field v-model="form.fatherInfo" :label="t('passport.fatherInfo')" class="mb-1" />
          <v-text-field v-model="form.motherInfo" :label="t('passport.motherInfo')" class="mb-1" />

          <div class="text-caption font-weight-bold text-medium-emphasis mb-1">{{ t('passport.financialStatus') }}</div>
          <v-radio-group v-model="form.financialStatus" inline hide-details class="mb-1">
            <v-radio v-for="o in financialStatusOpts" :key="o.value" :value="o.value" :label="t(o.label)" />
          </v-radio-group>

          <v-divider class="my-5" />

          <div class="text-subtitle-2 font-weight-bold text-uppercase text-medium-emphasis mb-3">
            {{ t('passport.education') }}
          </div>
          <div class="text-caption font-weight-bold text-medium-emphasis mb-1">{{ t('passport.educationForm') }}</div>
          <v-radio-group v-model="form.educationForm" inline hide-details class="mb-3">
            <v-radio v-for="o in educationFormOpts" :key="o.value" :value="o.value" :label="t(o.label)" />
          </v-radio-group>

          <div class="text-caption font-weight-bold text-medium-emphasis mb-1">{{ t('passport.workStatus') }}</div>
          <v-radio-group v-model="form.workStatus" inline hide-details class="mb-3">
            <v-radio v-for="o in workStatusOpts" :key="o.value" :value="o.value" :label="t(o.label)" />
          </v-radio-group>

          <v-text-field v-model="form.priorEducation" :label="t('passport.priorEducation')" class="mb-1" />
          <v-row dense>
            <v-col cols="6">
              <v-text-field v-model="form.gpaScore" :label="t('passport.gpaScore')" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="form.languageLevel" :label="t('passport.languageLevel')" />
            </v-col>
          </v-row>
          <v-textarea v-model="form.extracurricular" :label="t('passport.extracurricular')" rows="2" auto-grow class="mb-1" />
          <v-textarea v-model="form.leisureActivity" :label="t('passport.leisureActivity')" rows="2" auto-grow />

          <v-divider class="my-5" />

          <div class="text-subtitle-2 font-weight-bold text-uppercase text-medium-emphasis mb-3">
            {{ t('passport.additional') }}
          </div>
          <v-textarea
            v-model="form.healthLimitations"
            :label="`${t('passport.healthLimitations')} ${t('passport.optional')}`"
            rows="2"
            auto-grow
            class="mb-3"
          />

          <div class="text-caption font-weight-bold text-medium-emphasis mb-1">{{ t('passport.priorPsychologistVisit') }}</div>
          <v-radio-group v-model="form.priorPsychologistVisit" inline hide-details class="mb-3">
            <v-radio :value="true" :label="t('passport.yes')" />
            <v-radio :value="false" :label="t('passport.no')" />
          </v-radio-group>

          <v-textarea v-model="form.currentConcern" :label="t('passport.currentConcern')" rows="3" auto-grow />

          <v-btn color="primary" size="large" class="mt-4" :loading="saving" @click="submit">{{ t('common.save') }}</v-btn>
          <v-expand-transition>
            <v-alert v-if="saved" type="success" variant="tonal" density="compact" class="mt-3">
              {{ t('passport.saved') }}
            </v-alert>
          </v-expand-transition>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="surface-card pa-5 mb-4" rounded="lg">
          <div class="text-subtitle-1 font-weight-bold mb-3">{{ t('passport.completeness') }}</div>
          <div class="d-flex align-center mb-2" style="gap: 12px">
            <span class="text-h4 text-display font-weight-bold">{{ pct }}%</span>
            <v-progress-linear :model-value="pct" height="8" rounded color="primary" bg-color="surface-variant" />
          </div>
          <p class="text-caption text-medium-emphasis mb-0">
            {{ t('passport.completenessHint') }}
          </p>
        </v-card>

        <v-card class="surface-card pa-5" rounded="lg">
          <div class="text-subtitle-1 font-weight-bold mb-3">{{ t('passport.testResults') }}</div>
          <div class="d-flex align-center justify-space-between py-2">
            <span class="text-body-2">{{ instrumentLabel('FREQUENCY_BASED') }}</span>
            <v-chip v-if="resultOf('FREQUENCY_BASED')" size="small" color="secondary" variant="tonal">
              {{ resultOf('FREQUENCY_BASED') }}
            </v-chip>
            <v-btn v-else size="small" variant="text" color="primary" to="/tests/temperament/take">
              {{ t('passport.take') }}
            </v-btn>
          </div>
          <div class="d-flex align-center justify-space-between py-2">
            <span class="text-body-2">{{ instrumentLabel('RANKING_BASED') }}</span>
            <v-chip v-if="resultOf('RANKING_BASED')" size="small" color="secondary" variant="tonal">
              {{ resultOf('RANKING_BASED') }}
            </v-chip>
            <v-btn v-else size="small" variant="text" color="primary" to="/tests/psixogeometrik/take">
              {{ t('passport.take') }}
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
