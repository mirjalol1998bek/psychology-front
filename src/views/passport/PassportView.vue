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

const familyStatusOpts = [
  { value: 'single', label: 'passport.familyStatusSingle' },
  { value: 'married', label: 'passport.familyStatusMarried' },
]
const envOpts = [
  { value: 'calm', label: 'passport.envCalm' },
  { value: 'problematic', label: 'passport.envProblematic' },
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
              <v-text-field v-model="form.birthDate" type="date" :label="t('passport.birthDate')" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="`${auth.user?.hemis.faculty} · ${auth.user?.hemis.group}`"
                :label="t('passport.facultyCourseGroup')"
                readonly
                variant="filled"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.phone" :label="t('passport.phone')" placeholder="+998 __ ___ __ __" />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="form.currentAddress"
                :label="t('passport.currentAddress')"
              />
            </v-col>
          </v-row>

          <v-divider class="my-5" />

          <div class="text-subtitle-2 font-weight-bold text-uppercase text-medium-emphasis mb-3">
            {{ t('passport.family') }}
          </div>

          <div class="text-caption font-weight-bold text-medium-emphasis mb-1">{{ t('passport.familyStatus') }}</div>
          <v-radio-group v-model="form.familyStatus" inline hide-details class="mb-3">
            <v-radio v-for="o in familyStatusOpts" :key="o.value" :value="o.value" :label="t(o.label)" />
          </v-radio-group>

          <div class="text-caption font-weight-bold text-medium-emphasis mb-1">
            {{ t('passport.livingEnvironment') }}
          </div>
          <v-radio-group v-model="form.livingEnvironment" inline hide-details class="mb-3">
            <v-radio v-for="o in envOpts" :key="o.value" :value="o.value" :label="t(o.label)" />
          </v-radio-group>

          <v-textarea
            v-model="form.parentsInfo"
            :label="t('passport.parentsInfo')"
            rows="3"
            auto-grow
          />
          <v-textarea
            v-model="form.tutorInfo"
            :label="t('passport.tutorInfo')"
            rows="2"
            auto-grow
          />

          <v-divider class="my-5" />

          <div class="text-subtitle-2 font-weight-bold text-uppercase text-medium-emphasis mb-3">
            {{ t('passport.additional') }}
          </div>
          <v-textarea
            v-model="form.talents"
            :label="t('passport.talents')"
            rows="2"
            auto-grow
          />

          <v-btn color="primary" size="large" class="mt-2" :loading="saving" @click="submit">{{ t('common.save') }}</v-btn>
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
