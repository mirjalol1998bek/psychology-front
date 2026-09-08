<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAppealsStore, type AppealMode, type AppealTopic, type Appeal } from '@/stores/appeals'
import { useNotifications } from '@/composables/useNotifications'
import { MONTH_NAMES } from '@/composables/useMonthGrid'

const { locale } = useI18n()
const auth = useAuthStore()
const store = useAppealsStore()
const { refresh: refreshNotifications } = useNotifications()

store.load()
const sending = ref(false)

const ru = computed(() => locale.value === 'ru')
const t = (uz: string, rut: string) => (ru.value ? rut : uz)

const TOPICS: { value: AppealTopic; uz: string; ru: string; icon: string }[] = [
  { value: 'question', uz: 'Savol', ru: 'Вопрос', icon: 'mdi-help-circle-outline' },
  { value: 'appointment', uz: 'Qabulga yozilish', ru: 'Запись на приём', icon: 'mdi-calendar-heart' },
  { value: 'stress', uz: 'Ruhiy holat / stress', ru: 'Состояние / стресс', icon: 'mdi-weather-cloudy' },
  { value: 'other', uz: 'Boshqa', ru: 'Другое', icon: 'mdi-dots-horizontal' },
]
const topicMeta = (v: AppealTopic) => TOPICS.find((x) => x.value === v)!

function fmt(iso: string) {
  const d = new Date(iso)
  const m = ru.value
    ? ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'][d.getMonth()]
    : MONTH_NAMES[d.getMonth()].toLowerCase().slice(0, 3)
  return `${d.getDate()}-${m}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ============================ STUDENT ============================
const studentKey = computed(() => auth.user?.hemis.hemisId ?? 'anon')
const myAppeals = computed(() => store.forStudent(studentKey.value))

const form = ref<{ topic: AppealTopic; message: string; mode: AppealMode; wantsAppointment: boolean }>({
  topic: 'question',
  message: '',
  mode: 'named',
  wantsAppointment: false,
})
const sent = ref(false)

async function submitAppeal() {
  if (!form.value.message.trim() || sending.value) return
  sending.value = true
  try {
    await store.submit({
      mode: form.value.mode,
      topic: form.value.topic,
      message: form.value.message,
      wantsAppointment: form.value.wantsAppointment || form.value.topic === 'appointment',
    })
    form.value = { topic: 'question', message: '', mode: 'named', wantsAppointment: false }
    sent.value = true
    setTimeout(() => (sent.value = false), 2500)
  } finally {
    sending.value = false
  }
}

// ============================ STAFF ============================
const filter = ref<'open' | 'answered' | 'all'>('open')
const inbox = computed(() =>
  store.ordered.filter((a) => (filter.value === 'all' ? true : a.status === filter.value)),
)
const replyDrafts = ref<Record<string, string>>({})
const replying = ref<string | null>(null)
async function sendReply(a: Appeal) {
  const text = replyDrafts.value[a.id]
  if (!text?.trim() || replying.value) return
  replying.value = a.id
  try {
    await store.reply(a.id, text)
    delete replyDrafts.value[a.id]
    refreshNotifications()
  } finally {
    replying.value = null
  }
}
</script>

<template>
  <!-- ============================ STAFF INBOX ============================ -->
  <div v-if="auth.isStaff">
    <header class="page-head">
      <h1 class="text-h4">Murojaatlar</h1>
      <p class="text-body-2 text-medium-emphasis mb-0">
        Talabalarning savollari va qabul so‘rovlari. {{ store.openCount }} ta javob kutmoqda.
      </p>
    </header>

    <div class="d-flex flex-wrap mb-4" style="gap: 8px">
      <v-chip
        v-for="f in (['open', 'answered', 'all'] as const)"
        :key="f"
        :variant="filter === f ? 'flat' : 'tonal'"
        :color="filter === f ? 'primary' : undefined"
        @click="filter = f"
      >
        {{ { open: 'Javob kutmoqda', answered: 'Javob berilgan', all: 'Barchasi' }[f] }}
      </v-chip>
    </div>

    <v-card v-for="a in inbox" :key="a.id" class="surface-card pa-5 mb-3" rounded="lg">
      <div class="d-flex align-center flex-wrap mb-3" style="gap: 10px">
        <div class="icon-tile" :style="{ '--tint': a.mode === 'anonymous' ? 'rgb(var(--v-theme-secondary))' : 'rgb(var(--v-theme-primary))' }">
          <v-icon :icon="a.mode === 'anonymous' ? 'mdi-incognito' : 'mdi-account-outline'" size="19" />
        </div>
        <div class="flex-grow-1" style="min-width: 0">
          <div class="font-weight-bold">
            {{ a.mode === 'anonymous' ? 'Anonim talaba' : a.studentName }}
          </div>
          <div class="text-caption text-medium-emphasis">
            <template v-if="a.mode !== 'anonymous' && a.group">{{ a.faculty }} · {{ a.group }} · </template>
            {{ fmt(a.createdAt) }}
          </div>
        </div>
        <v-chip size="small" variant="tonal" :prepend-icon="topicMeta(a.topic).icon">
          {{ topicMeta(a.topic).uz }}
        </v-chip>
        <v-chip v-if="a.wantsAppointment" size="small" variant="tonal" color="secondary" prepend-icon="mdi-calendar-heart">
          Qabul so‘ralgan
        </v-chip>
        <v-chip size="small" :color="a.status === 'answered' ? 'success' : 'warning'" variant="tonal">
          {{ a.status === 'answered' ? 'Javob berilgan' : 'Ochiq' }}
        </v-chip>
      </div>

      <p class="text-body-2 mb-4" style="white-space: pre-wrap">{{ a.message }}</p>

      <div v-if="a.reply" class="reply-block">
        <div class="text-caption font-weight-bold text-primary mb-1">
          <v-icon icon="mdi-reply" size="14" class="mr-1" />{{ a.repliedBy }} · {{ fmt(a.repliedAt!) }}
        </div>
        <p class="text-body-2 mb-0" style="white-space: pre-wrap">{{ a.reply }}</p>
      </div>

      <div v-else>
        <v-textarea
          v-model="replyDrafts[a.id]"
          :placeholder="a.wantsAppointment ? 'Javob yozing va kerak bo‘lsa qabul kalendaridan vaqt belgilang…' : 'Javob yozing…'"
          rows="2"
          auto-grow
          hide-details
          class="mb-2"
        />
        <div class="d-flex justify-end" style="gap: 8px">
          <v-btn v-if="a.wantsAppointment" variant="tonal" color="secondary" size="small" to="/calendar" prepend-icon="mdi-calendar-plus">
            Qabul kalendari
          </v-btn>
          <v-btn
            color="primary"
            size="small"
            :loading="replying === a.id"
            :disabled="!replyDrafts[a.id]?.trim()"
            @click="sendReply(a)"
          >
            Javob berish
          </v-btn>
        </div>
      </div>
    </v-card>

    <v-empty-state
      v-if="!inbox.length"
      icon="mdi-inbox-outline"
      title="Murojaat yo‘q"
      text="Bu bo‘limda talabalarning murojaatlari ko‘rinadi."
    />
  </div>

  <!-- ============================ STUDENT ============================ -->
  <div v-else>
    <header class="page-head">
      <h1 class="text-h4">{{ t('Psixologga murojaat', 'Обращение к психологу') }}</h1>
      <p class="text-body-2 text-medium-emphasis mb-0" style="max-width: 62ch">
        {{
          t(
            'Savolingiz, qabulga yozilish yoki ruhiy holatingiz bo‘yicha psixologga yozing. Xohlasangiz anonim yuboring — ismingiz ko‘rinmaydi.',
            'Напишите психологу вопрос, запрос на приём или о своём состоянии. Можно отправить анонимно — ваше имя не будет видно.',
          )
        }}
      </p>
    </header>

    <v-row>
      <v-col cols="12" md="6">
        <v-card class="surface-card pa-5" rounded="lg">
          <div class="text-subtitle-1 font-weight-bold mb-4">{{ t('Yangi murojaat', 'Новое обращение') }}</div>

          <div class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-2">
            {{ t('Mavzu', 'Тема') }}
          </div>
          <div class="d-flex flex-wrap mb-4" style="gap: 8px">
            <v-chip
              v-for="tp in TOPICS"
              :key="tp.value"
              :variant="form.topic === tp.value ? 'flat' : 'tonal'"
              :color="form.topic === tp.value ? 'primary' : undefined"
              :prepend-icon="tp.icon"
              @click="form.topic = tp.value"
            >
              {{ ru ? tp.ru : tp.uz }}
            </v-chip>
          </div>

          <v-textarea
            v-model="form.message"
            :label="t('Xabaringiz', 'Ваше сообщение')"
            rows="4"
            auto-grow
            counter
            maxlength="1200"
          />

          <v-checkbox
            v-model="form.wantsAppointment"
            :label="t('Shaxsiy qabulga yozilishni so‘rayman', 'Прошу записать на личный приём')"
            density="compact"
            hide-details
            class="mb-2"
          />

          <div class="surface-sunken pa-3 mb-4" style="border-radius: var(--radius-sm)">
            <v-radio-group v-model="form.mode" hide-details density="compact">
              <v-radio value="named">
                <template #label>
                  <span class="text-body-2">
                    {{ t('Ismim bilan', 'От своего имени') }}
                    <span class="text-caption text-medium-emphasis d-block">
                      {{ auth.user?.hemis.fullName }} · {{ auth.user?.hemis.group }}
                    </span>
                  </span>
                </template>
              </v-radio>
              <v-radio value="anonymous">
                <template #label>
                  <span class="text-body-2">
                    {{ t('Anonim', 'Анонимно') }}
                    <span class="text-caption text-medium-emphasis d-block">
                      {{ t('Psixolog ismingizni ko‘rmaydi', 'Психолог не увидит ваше имя') }}
                    </span>
                  </span>
                </template>
              </v-radio>
            </v-radio-group>
          </div>

          <v-btn color="primary" block :loading="sending" :disabled="!form.message.trim()" @click="submitAppeal">
            {{ t('Yuborish', 'Отправить') }}
          </v-btn>
          <v-expand-transition>
            <v-alert v-if="sent" type="success" variant="tonal" density="compact" class="mt-3">
              {{ t('Murojaatingiz yuborildi. Javob shu sahifada ko‘rinadi.', 'Обращение отправлено. Ответ появится на этой странице.') }}
            </v-alert>
          </v-expand-transition>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <div class="text-subtitle-1 font-weight-bold mb-3">{{ t('Mening murojaatlarim', 'Мои обращения') }}</div>

        <v-card v-for="a in myAppeals" :key="a.id" class="surface-card pa-4 mb-3" rounded="lg">
          <div class="d-flex align-center flex-wrap mb-2" style="gap: 8px">
            <v-chip size="x-small" variant="tonal" :prepend-icon="topicMeta(a.topic).icon">
              {{ ru ? topicMeta(a.topic).ru : topicMeta(a.topic).uz }}
            </v-chip>
            <v-chip v-if="a.mode === 'anonymous'" size="x-small" variant="tonal" prepend-icon="mdi-incognito">
              {{ t('Anonim', 'Аноним') }}
            </v-chip>
            <v-spacer />
            <span class="text-caption text-medium-emphasis">{{ fmt(a.createdAt) }}</span>
          </div>
          <p class="text-body-2 mb-0" style="white-space: pre-wrap">{{ a.message }}</p>

          <div v-if="a.reply" class="reply-block mt-3">
            <div class="text-caption font-weight-bold text-primary mb-1">
              <v-icon icon="mdi-reply" size="14" class="mr-1" />{{ a.repliedBy }}
            </div>
            <p class="text-body-2 mb-0" style="white-space: pre-wrap">{{ a.reply }}</p>
          </div>
          <div v-else class="text-caption text-warning font-weight-medium mt-2">
            <v-icon icon="mdi-clock-outline" size="14" class="mr-1" />{{ t('Javob kutilmoqda', 'Ожидается ответ') }}
          </div>
        </v-card>

        <v-empty-state
          v-if="!myAppeals.length"
          icon="mdi-message-text-outline"
          :title="t('Hali murojaat yo‘q', 'Пока нет обращений')"
          density="comfortable"
        />
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.reply-block {
  border-left: 3px solid rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  padding: 10px 14px;
}
</style>
