<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { usePassportStore, emptyPassport, completeness, type PassportData } from '@/stores/passport'
import { getAttempts } from '@/services/attemptService'
import { INSTRUMENT_META } from '@/utils/instruments'
import type { StoredAttempt } from '@/types/assessment'

const { locale } = useI18n()
const auth = useAuthStore()
const store = usePassportStore()

const ru = computed(() => locale.value === 'ru')
const t = (uz: string, rut: string) => (ru.value ? rut : uz)

const studentKey = computed(() => auth.user?.hemis.hemisId ?? 'anon')

const form = reactive<PassportData>({ ...emptyPassport(), ...(store.get(studentKey.value) ?? {}) })
const saved = ref(false)
const pct = computed(() => completeness(form))

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

function submit() {
  store.save(studentKey.value, { ...form })
  saved.value = true
  setTimeout(() => (saved.value = false), 2500)
}

const familyStatusOpts = [
  { value: 'single', uz: 'Uylanmagan / turmushga chiqmagan', ru: 'Не женат / не замужем' },
  { value: 'married', uz: 'Uylangan / turmushga chiqqan', ru: 'Женат / замужем' },
]
const envOpts = [
  { value: 'calm', uz: 'Tinch', ru: 'Спокойная' },
  { value: 'problematic', uz: 'Muammoli', ru: 'Проблемная' },
]
</script>

<template>
  <div>
    <header class="page-head">
      <h1 class="text-h4">{{ t('Ijtimoiy-psixologik pasport', 'Социально-психологический паспорт') }}</h1>
      <p class="text-body-2 text-medium-emphasis mb-0" style="max-width: 64ch">
        {{
          t(
            'Bu ma’lumotlar psixologik xizmatga sizni yaxshiroq qo‘llab-quvvatlashda yordam beradi. Faqat psixolog va administrator ko‘radi.',
            'Эти данные помогут психологической службе лучше вас поддержать. Их видят только психолог и администратор.',
          )
        }}
      </p>
    </header>

    <v-row>
      <v-col cols="12" lg="8">
        <v-card class="surface-card pa-5 pa-md-6" rounded="lg">
          <div class="text-subtitle-2 font-weight-bold text-uppercase text-medium-emphasis mb-3">
            {{ t('Shaxsiy ma’lumotlar', 'Личные данные') }}
          </div>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="auth.user?.hemis.fullName"
                :label="t('F.I.O.', 'Ф.И.О.')"
                readonly
                variant="filled"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.birthDate" type="date" :label="t('Tug‘ilgan sana', 'Дата рождения')" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="`${auth.user?.hemis.faculty} · ${auth.user?.hemis.group}`"
                :label="t('Fakultet, kurs, guruh', 'Факультет, курс, группа')"
                readonly
                variant="filled"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.phone" :label="t('Telefon raqamingiz', 'Ваш телефон')" placeholder="+998 __ ___ __ __" />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="form.currentAddress"
                :label="t('Hozirgi turar joyingiz (manzil)', 'Текущее место проживания (адрес)')"
              />
            </v-col>
          </v-row>

          <v-divider class="my-5" />

          <div class="text-subtitle-2 font-weight-bold text-uppercase text-medium-emphasis mb-3">
            {{ t('Oila', 'Семья') }}
          </div>

          <div class="text-caption font-weight-bold text-medium-emphasis mb-1">{{ t('Oilaviy ahvoli', 'Семейное положение') }}</div>
          <v-radio-group v-model="form.familyStatus" inline hide-details class="mb-3">
            <v-radio v-for="o in familyStatusOpts" :key="o.value" :value="o.value" :label="ru ? o.ru : o.uz" />
          </v-radio-group>

          <div class="text-caption font-weight-bold text-medium-emphasis mb-1">
            {{ t('Oilaviy yashash muhiti', 'Атмосфера в семье') }}
          </div>
          <v-radio-group v-model="form.livingEnvironment" inline hide-details class="mb-3">
            <v-radio v-for="o in envOpts" :key="o.value" :value="o.value" :label="ru ? o.ru : o.uz" />
          </v-radio-group>

          <v-textarea
            v-model="form.parentsInfo"
            :label="t('Ota-onasi: F.I.O., telefon, ish joyi', 'Родители: Ф.И.О., телефон, место работы')"
            rows="3"
            auto-grow
          />
          <v-textarea
            v-model="form.tutorInfo"
            :label="t('Biriktirilgan tyutor: F.I.O., telefon', 'Закреплённый тьютор: Ф.И.О., телефон')"
            rows="2"
            auto-grow
          />

          <v-divider class="my-5" />

          <div class="text-subtitle-2 font-weight-bold text-uppercase text-medium-emphasis mb-3">
            {{ t('Qo‘shimcha', 'Дополнительно') }}
          </div>
          <v-textarea
            v-model="form.talents"
            :label="t('Alohida qobiliyat va iqtidoringiz', 'Особые способности и таланты')"
            rows="2"
            auto-grow
          />

          <v-btn color="primary" size="large" class="mt-2" @click="submit">{{ t('Saqlash', 'Сохранить') }}</v-btn>
          <v-expand-transition>
            <v-alert v-if="saved" type="success" variant="tonal" density="compact" class="mt-3">
              {{ t('Pasport saqlandi.', 'Паспорт сохранён.') }}
            </v-alert>
          </v-expand-transition>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="surface-card pa-5 mb-4" rounded="lg">
          <div class="text-subtitle-1 font-weight-bold mb-3">{{ t('To‘ldirilganlik', 'Заполненность') }}</div>
          <div class="d-flex align-center mb-2" style="gap: 12px">
            <span class="text-h4 text-display font-weight-bold">{{ pct }}%</span>
            <v-progress-linear :model-value="pct" height="8" rounded color="primary" bg-color="surface-variant" />
          </div>
          <p class="text-caption text-medium-emphasis mb-0">
            {{ t('Barcha maydonlarni to‘ldirsangiz psixolog to‘liq portret ko‘radi.', 'Заполните все поля, чтобы психолог видел полный портрет.') }}
          </p>
        </v-card>

        <v-card class="surface-card pa-5" rounded="lg">
          <div class="text-subtitle-1 font-weight-bold mb-3">{{ t('Test natijalari', 'Результаты тестов') }}</div>
          <div class="d-flex align-center justify-space-between py-2">
            <span class="text-body-2">{{ INSTRUMENT_META.FREQUENCY_BASED.label }}</span>
            <v-chip v-if="resultOf('FREQUENCY_BASED')" size="small" color="secondary" variant="tonal">
              {{ resultOf('FREQUENCY_BASED') }}
            </v-chip>
            <v-btn v-else size="small" variant="text" color="primary" to="/tests/temperament/take">
              {{ t('Topshirish', 'Пройти') }}
            </v-btn>
          </div>
          <div class="d-flex align-center justify-space-between py-2">
            <span class="text-body-2">{{ INSTRUMENT_META.RANKING_BASED.label }}</span>
            <v-chip v-if="resultOf('RANKING_BASED')" size="small" color="secondary" variant="tonal">
              {{ resultOf('RANKING_BASED') }}
            </v-chip>
            <v-btn v-else size="small" variant="text" color="primary" to="/tests/psixogeometrik/take">
              {{ t('Topshirish', 'Пройти') }}
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
