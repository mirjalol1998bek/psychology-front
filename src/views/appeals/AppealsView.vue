<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppealsStore, type AppealMode, type AppealTopic, type Appeal } from '@/stores/appeals'
import { useNotifications } from '@/composables/useNotifications'
import { formatDay } from '@/utils/datetime'

const { t } = useI18n()
const route = useRoute()
const auth = useAuthStore()
const store = useAppealsStore()
const { refresh: refreshNotifications } = useNotifications()

store.load()
const sending = ref(false)

// Bildirishnoma havolasi (/appeals/<id> yoki ?focus=<id>) — o'sha murojaatga
// aylantiramiz va bir lahzaga ajratib ko'rsatamiz.
const highlightedId = ref('')
const focusId = computed(() => {
  const raw = route.params.id ?? route.query.focus
  return Array.isArray(raw) ? String(raw[0] ?? '') : raw ? String(raw) : ''
})

async function focusRequestedAppeal() {
  const id = focusId.value
  if (!id || store.loading) return
  if (auth.isStaff) filter.value = 'all'

  await nextTick()
  const card = document.getElementById(`appeal-${id}`)
  if (!card) return

  card.scrollIntoView({ behavior: 'smooth', block: 'center' })
  highlightedId.value = id
  window.setTimeout(() => {
    if (highlightedId.value === id) highlightedId.value = ''
  }, 2600)
}

const TOPICS: { value: AppealTopic; label: string; icon: string }[] = [
  { value: 'question', label: 'appeals.topics.question', icon: 'mdi-help-circle-outline' },
  { value: 'appointment', label: 'appeals.topics.appointment', icon: 'mdi-calendar-heart' },
  { value: 'stress', label: 'appeals.topics.stress', icon: 'mdi-weather-cloudy' },
  { value: 'other', label: 'appeals.topics.other', icon: 'mdi-dots-horizontal' },
]
const topicMeta = (v: AppealTopic) => TOPICS.find((x) => x.value === v)!

const fmt = (iso: string) => formatDay(iso, { short: true, time: true })

// ============================ STUDENT ============================
const studentKey = computed(() => auth.user?.hemis.hemisId ?? 'anon')
const myAppeals = computed(() => store.forStudent(studentKey.value))

const form = ref<{
  topic: AppealTopic
  message: string
  mode: AppealMode
  wantsAppointment: boolean
  preferredDate: string
  preferredTime: string
}>({
  topic: 'question',
  message: '',
  mode: 'named',
  wantsAppointment: false,
  preferredDate: '',
  preferredTime: '',
})
const sent = ref(false)
const wantsAppointment = computed(() => form.value.wantsAppointment || form.value.topic === 'appointment')

async function submitAppeal() {
  if (!form.value.message.trim() || sending.value) return
  sending.value = true
  try {
    await store.submit({
      mode: form.value.mode,
      topic: form.value.topic,
      message: form.value.message,
      wantsAppointment: wantsAppointment.value,
      preferredDate: wantsAppointment.value ? form.value.preferredDate || undefined : undefined,
      preferredTime: wantsAppointment.value ? form.value.preferredTime || undefined : undefined,
    })
    form.value = { topic: 'question', message: '', mode: 'named', wantsAppointment: false, preferredDate: '', preferredTime: '' }
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

// --- Qabulni tasdiqlash (2 soatlik AppointmentSlot yaratadi) --------------
const bookingAppeal = ref<Appeal | null>(null)
const bookForm = ref({ date: '', startTime: '' })
const booking = ref(false)
const bookError = ref('')

function openBook(a: Appeal) {
  bookingAppeal.value = a
  bookForm.value = { date: a.preferredDate || '', startTime: a.preferredTime || '' }
  bookError.value = ''
}

async function confirmBook() {
  const a = bookingAppeal.value
  if (!a || !bookForm.value.date || !bookForm.value.startTime || booking.value) return
  booking.value = true
  bookError.value = ''
  try {
    await store.bookAppointment(a.id, bookForm.value.date, bookForm.value.startTime)
    refreshNotifications()
    bookingAppeal.value = null
  } catch (e) {
    const status = (e as { response?: { status?: number } })?.response?.status
    bookError.value = status === 409 ? t('appeals.staff.bookConflict') : t('appeals.staff.bookError')
  } finally {
    booking.value = false
  }
}

// `filter` yuqorida e'lon qilingandan keyin — bildirishnoma havolasiga reaksiya.
watch(
  [focusId, () => store.loading, () => store.appeals.length],
  focusRequestedAppeal,
  { immediate: true },
)
</script>

<template>
  <!-- ============================ STAFF INBOX ============================ -->
  <div v-if="auth.isStaff">
    <header class="page-head">
      <h1 class="text-h4">{{ t('appeals.staff.title') }}</h1>
      <p class="text-body-2 text-medium-emphasis mb-0">
        {{ t('appeals.staff.subtitle', { n: store.openCount }) }}
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
        {{ { open: t('appeals.staff.filterOpen'), answered: t('appeals.staff.filterAnswered'), all: t('appeals.staff.filterAll') }[f] }}
      </v-chip>
    </div>

    <v-card
      v-for="a in inbox"
      :id="`appeal-${a.id}`"
      :key="a.id"
      class="surface-card pa-5 mb-3"
      :class="{ 'appeal-focused': highlightedId === a.id }"
      rounded="lg"
    >
      <div class="d-flex align-center flex-wrap mb-3" style="gap: 10px">
        <div class="icon-tile" :style="{ '--tint': a.mode === 'anonymous' ? 'rgb(var(--v-theme-secondary))' : 'rgb(var(--v-theme-primary))' }">
          <v-icon :icon="a.mode === 'anonymous' ? 'mdi-incognito' : 'mdi-account-outline'" size="19" />
        </div>
        <div class="flex-grow-1" style="min-width: 0">
          <div class="font-weight-bold">
            {{ a.mode === 'anonymous' ? t('appeals.staff.anonStudent') : a.studentName }}
          </div>
          <div class="text-caption text-medium-emphasis">
            <template v-if="a.mode !== 'anonymous' && a.group">{{ a.faculty }} · {{ a.group }} · </template>
            {{ fmt(a.createdAt) }}
          </div>
        </div>
        <v-chip size="small" variant="tonal" :prepend-icon="topicMeta(a.topic).icon">
          {{ t(topicMeta(a.topic).label) }}
        </v-chip>
        <v-chip v-if="a.wantsAppointment && a.appointmentDate" size="small" variant="tonal" color="success" prepend-icon="mdi-calendar-check">
          {{ t('appeals.staff.bookedChip', { date: a.appointmentDate, start: a.appointmentStartTime, end: a.appointmentEndTime }) }}
        </v-chip>
        <v-chip v-else-if="a.wantsAppointment" size="small" variant="tonal" color="secondary" prepend-icon="mdi-calendar-heart">
          {{ t('appeals.staff.appointmentRequested') }}
        </v-chip>
        <v-chip size="small" :color="a.status === 'answered' ? 'success' : 'warning'" variant="tonal">
          {{ a.status === 'answered' ? t('appeals.staff.answered') : t('appeals.staff.open') }}
        </v-chip>
      </div>

      <p class="text-body-2 mb-4" style="white-space: pre-wrap">{{ a.message }}</p>

      <div v-if="a.wantsAppointment && !a.appointmentDate" class="d-flex align-center flex-wrap mb-4" style="gap: 10px">
        <span v-if="a.preferredDate" class="text-caption text-medium-emphasis">
          <v-icon icon="mdi-calendar-clock-outline" size="14" class="mr-1" />
          {{ t('appeals.staff.preferredLabel', { date: a.preferredDate, time: a.preferredTime }) }}
        </span>
        <v-btn size="small" color="secondary" variant="tonal" prepend-icon="mdi-calendar-check-outline" @click="openBook(a)">
          {{ t('appeals.staff.book') }}
        </v-btn>
      </div>

      <div v-if="a.reply" class="reply-block">
        <div class="text-caption font-weight-bold text-primary mb-1">
          <v-icon icon="mdi-reply" size="14" class="mr-1" />{{ a.repliedBy }} · {{ fmt(a.repliedAt!) }}
        </div>
        <p class="text-body-2 mb-0" style="white-space: pre-wrap">{{ a.reply }}</p>
      </div>

      <div v-else>
        <v-textarea
          v-model="replyDrafts[a.id]"
          :placeholder="a.wantsAppointment ? t('appeals.staff.replyPlaceholderAppointment') : t('appeals.staff.replyPlaceholder')"
          rows="2"
          auto-grow
          hide-details
          class="mb-2"
        />
        <div class="d-flex justify-end" style="gap: 8px">
          <v-btn
            color="primary"
            size="small"
            :loading="replying === a.id"
            :disabled="!replyDrafts[a.id]?.trim()"
            @click="sendReply(a)"
          >
            {{ t('appeals.staff.reply') }}
          </v-btn>
        </div>
      </div>
    </v-card>

    <v-empty-state
      v-if="!inbox.length"
      icon="mdi-inbox-outline"
      :title="t('appeals.staff.emptyTitle')"
      :text="t('appeals.staff.emptyText')"
    />

    <v-dialog :model-value="bookingAppeal !== null" max-width="420" @update:model-value="bookingAppeal = null">
      <v-card v-if="bookingAppeal" class="surface-card pa-6" rounded="lg">
        <div class="d-flex align-center justify-space-between mb-4">
          <span class="text-subtitle-1 font-weight-bold">{{ t('appeals.staff.bookDialogTitle') }}</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="bookingAppeal = null" />
        </div>
        <div class="text-body-2 font-weight-bold mb-1">
          {{ bookingAppeal.mode === 'anonymous' ? t('appeals.staff.anonStudent') : bookingAppeal.studentName }}
        </div>
        <v-row dense class="mt-1">
          <v-col cols="6">
            <v-text-field v-model="bookForm.date" type="date" :label="t('appeals.staff.bookDateLabel')" density="comfortable" autofocus />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="bookForm.startTime" type="time" :label="t('appeals.staff.bookTimeLabel')" density="comfortable" />
          </v-col>
        </v-row>
        <p class="text-caption text-medium-emphasis mb-3">{{ t('appeals.staff.bookDurationHint') }}</p>
        <v-alert v-if="bookError" type="error" variant="tonal" density="compact" class="mb-3">{{ bookError }}</v-alert>
        <div class="d-flex justify-end" style="gap: 8px">
          <v-btn variant="text" @click="bookingAppeal = null">{{ t('common.cancel') }}</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="booking"
            :disabled="!bookForm.date || !bookForm.startTime"
            @click="confirmBook"
          >
            {{ t('appeals.staff.bookConfirm') }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>

  <!-- ============================ STUDENT ============================ -->
  <div v-else>
    <header class="page-head">
      <h1 class="text-h4">{{ t('appeals.studentTitle') }}</h1>
      <p class="text-body-2 text-medium-emphasis mb-0" style="max-width: 62ch">
        {{ t('appeals.studentSubtitle') }}
      </p>
    </header>

    <v-row>
      <v-col cols="12" md="6">
        <v-card class="surface-card pa-5" rounded="lg">
          <div class="text-subtitle-1 font-weight-bold mb-4">{{ t('appeals.newAppeal') }}</div>

          <div class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-2">
            {{ t('appeals.topic') }}
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
              {{ t(tp.label) }}
            </v-chip>
          </div>

          <v-textarea
            v-model="form.message"
            :label="t('appeals.yourMessage')"
            rows="4"
            auto-grow
            counter
            maxlength="1200"
          />

          <v-checkbox
            v-model="form.wantsAppointment"
            :label="t('appeals.requestAppointment')"
            density="compact"
            hide-details
            class="mb-2"
          />

          <v-expand-transition>
            <div v-if="wantsAppointment" class="mb-4">
              <v-row dense>
                <v-col cols="6">
                  <v-text-field v-model="form.preferredDate" type="date" :label="t('appeals.preferredDate')" density="compact" hide-details />
                </v-col>
                <v-col cols="6">
                  <v-text-field v-model="form.preferredTime" type="time" :label="t('appeals.preferredTime')" density="compact" hide-details />
                </v-col>
              </v-row>
              <p class="text-caption text-medium-emphasis mt-2 mb-0 d-flex" style="gap: 6px">
                <v-icon icon="mdi-information-outline" size="14" style="margin-top: 2px" />
                <span>
                  {{ t('appeals.preferredHint') }}
                  <router-link to="/calendar" class="text-primary font-weight-medium">{{ t('appeals.viewCalendar') }}</router-link>
                </span>
              </p>
            </div>
          </v-expand-transition>

          <div class="surface-sunken pa-3 mb-4" style="border-radius: var(--radius-sm)">
            <v-radio-group v-model="form.mode" hide-details density="compact">
              <v-radio value="named">
                <template #label>
                  <span class="text-body-2">
                    {{ t('appeals.named') }}
                    <span class="text-caption text-medium-emphasis d-block">
                      {{ auth.user?.hemis.fullName }} · {{ auth.user?.hemis.group }}
                    </span>
                  </span>
                </template>
              </v-radio>
              <v-radio value="anonymous">
                <template #label>
                  <span class="text-body-2">
                    {{ t('appeals.anonymous') }}
                    <span class="text-caption text-medium-emphasis d-block">
                      {{ t('appeals.psychologistWontSee') }}
                    </span>
                  </span>
                </template>
              </v-radio>
            </v-radio-group>
          </div>

          <v-btn color="primary" block :loading="sending" :disabled="!form.message.trim()" @click="submitAppeal">
            {{ t('appeals.send') }}
          </v-btn>
          <v-expand-transition>
            <v-alert v-if="sent" type="success" variant="tonal" density="compact" class="mt-3">
              {{ t('appeals.sent') }}
            </v-alert>
          </v-expand-transition>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <div class="text-subtitle-1 font-weight-bold mb-3">{{ t('appeals.myAppeals') }}</div>

        <v-card
          v-for="a in myAppeals"
          :id="`appeal-${a.id}`"
          :key="a.id"
          class="surface-card pa-4 mb-3"
          :class="{ 'appeal-focused': highlightedId === a.id }"
          rounded="lg"
        >
          <div class="d-flex align-center flex-wrap mb-2" style="gap: 8px">
            <v-chip size="x-small" variant="tonal" :prepend-icon="topicMeta(a.topic).icon">
              {{ t(topicMeta(a.topic).label) }}
            </v-chip>
            <v-chip v-if="a.mode === 'anonymous'" size="x-small" variant="tonal" prepend-icon="mdi-incognito">
              {{ t('appeals.anon') }}
            </v-chip>
            <v-spacer />
            <span class="text-caption text-medium-emphasis">{{ fmt(a.createdAt) }}</span>
          </div>
          <p class="text-body-2 mb-0" style="white-space: pre-wrap">{{ a.message }}</p>

          <v-alert v-if="a.appointmentDate" type="success" variant="tonal" density="compact" class="mt-3" icon="mdi-calendar-check">
            {{ t('appeals.appointmentConfirmed', { date: a.appointmentDate, start: a.appointmentStartTime, end: a.appointmentEndTime }) }}
          </v-alert>

          <div v-if="a.reply" class="reply-block mt-3">
            <div class="text-caption font-weight-bold text-primary mb-1">
              <v-icon icon="mdi-reply" size="14" class="mr-1" />{{ a.repliedBy }}
            </div>
            <p class="text-body-2 mb-0" style="white-space: pre-wrap">{{ a.reply }}</p>
          </div>
          <div v-else-if="a.wantsAppointment && a.preferredDate" class="text-caption text-warning font-weight-medium mt-2">
            <v-icon icon="mdi-clock-outline" size="14" class="mr-1" />
            {{ t('appeals.appointmentPending', { date: a.preferredDate, time: a.preferredTime }) }}
          </div>
          <div v-else class="text-caption text-warning font-weight-medium mt-2">
            <v-icon icon="mdi-clock-outline" size="14" class="mr-1" />{{ t('appeals.awaitingReply') }}
          </div>
        </v-card>

        <v-empty-state
          v-if="!myAppeals.length"
          icon="mdi-message-text-outline"
          :title="t('appeals.emptyTitle')"
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

.appeal-focused {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
  animation: appeal-pulse 2.4s var(--ease);
}
@keyframes appeal-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.45);
  }
  60% {
    box-shadow: 0 0 0 10px rgba(var(--v-theme-primary), 0);
  }
}
</style>
