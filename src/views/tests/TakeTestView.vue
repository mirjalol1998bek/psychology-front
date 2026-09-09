<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { instrumentByRoute, INSTRUMENT_META } from '@/utils/instruments'
import { startTest, saveTest, submitTest } from '@/services/attemptService'
import type { QuizRef } from '@/services/quizService'
import { answeredCount, totalItems } from '@/utils/scoring'
import type { AnswerMap, RunnableQuiz } from '@/types/assessment'
import type { StudyLanguage } from '@/types/domain'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const instrument = instrumentByRoute(route.params.id as string)
const meta = INSTRUMENT_META[instrument]
const language = (auth.user?.hemis.studyLanguage ?? 'uz') as StudyLanguage

const quiz = ref<RunnableQuiz | null>(null)
const answers = ref<AnswerMap>({})
const loading = ref(true)
const submitting = ref(false)
const notAvailable = ref(false)
const unavailableReason = ref<'not_assigned' | 'not_configured' | 'error'>('not_configured')
const blockIndex = ref(0)

let attemptId = 0
let quizRef: QuizRef | null = null

const t = (uz: string, ru: string) => (language === 'ru' ? ru : uz)

async function load() {
  const started = await startTest(instrument, language)
  if (started.unavailable) {
    notAvailable.value = true
    unavailableReason.value = started.reason
    loading.value = false
    return
  }
  if (started.status === 'submitted') {
    router.replace(`/tests/${meta.routeSegment}/result`)
    return
  }
  quiz.value = started.quiz
  quizRef = started.ref
  attemptId = started.attemptId
  answers.value = started.savedAnswers
  loading.value = false
}
load()

// Debounced draft save (full-replace on the backend).
let saveTimer: ReturnType<typeof setTimeout> | undefined
watch(
  answers,
  (a) => {
    if (!quiz.value || !quizRef || !attemptId) return
    clearTimeout(saveTimer)
    const snapshot = { ...a }
    saveTimer = setTimeout(() => {
      if (quiz.value && quizRef) saveTest(attemptId, quiz.value, snapshot, quizRef).catch(() => {})
    }, 600)
  },
  { deep: true },
)

const total = computed(() => (quiz.value ? totalItems(quiz.value) : 0))
const answered = computed(() => (quiz.value ? answeredCount(quiz.value, answers.value) : 0))
const progress = computed(() => (total.value ? Math.round((answered.value / total.value) * 100) : 0))
const canSubmit = computed(() => answered.value === total.value && total.value > 0)

// Typed per-format views so the template narrows cleanly.
const agreeQuiz = computed(() => (quiz.value?.format === 'agree_statements' ? quiz.value : null))
const choiceQuiz = computed(() => (quiz.value?.format === 'single_choice' ? quiz.value : null))
const figureQuiz = computed(() => (quiz.value?.format === 'figure_choice' ? quiz.value : null))
const scaleQuiz = computed(() => (quiz.value?.format === 'scale_choice' ? quiz.value : null))

// --- agree_statements ---------------------------------------------------
const currentBlock = computed(() => agreeQuiz.value?.blocks[blockIndex.value] ?? null)
const blockAnswered = computed(() => {
  const b = currentBlock.value
  if (!b) return 0
  return b.statements.filter((_s, i) => answers.value[`${b.key}:${i}`] !== undefined).length
})
function setAgree(key: string, i: number, value: 0 | 1) {
  answers.value[`${key}:${i}`] = value
}

// --- single_choice / scale_choice ------------------------------------
function setChoice(qi: number, oi: number) {
  answers.value[`q${qi}`] = oi
}

// --- figure_choice --------------------------------------------------
function setFigure(i: number) {
  answers.value.selected = i
}
const figureShape: Record<string, string> = {
  Kvadrat: 'M16 16 H48 V48 H16 Z',
  Uchburchak: 'M32 12 L52 52 H12 Z',
  "To'g'ri to'rtburchak": 'M20 12 H44 V52 H20 Z',
  Doira: '',
  Zigzag: 'M14 14 H40 L20 32 H46 L26 50',
}

async function submit() {
  if (!quiz.value || !quizRef || !canSubmit.value) return
  submitting.value = true
  try {
    clearTimeout(saveTimer)
    await saveTest(attemptId, quiz.value, { ...answers.value }, quizRef)
    await submitTest(attemptId)
    router.push(`/tests/${meta.routeSegment}/result`)
  } catch {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-3" @click="router.push('/tests')">
      {{ t('Testlar', 'Тесты') }}
    </v-btn>

    <div v-if="loading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <v-card v-else-if="notAvailable" class="surface-card pa-8 text-center" rounded="lg" max-width="480">
      <v-icon
        :icon="unavailableReason === 'not_assigned' ? 'mdi-calendar-clock-outline' : 'mdi-progress-wrench'"
        size="40"
        color="primary"
        class="mb-3"
      />
      <div class="text-h6 text-display font-weight-bold mb-2">{{ meta.label }}</div>
      <p class="text-body-2 text-medium-emphasis mb-5">
        <template v-if="unavailableReason === 'not_assigned'">
          {{ t('Bu metodika hozircha sizning guruhingizga biriktirilmagan.', 'Эта методика пока не назначена вашей группе.') }}
        </template>
        <template v-else>
          {{ t('Bu metodika hali platformaga ulanmagan.', 'Эта методика ещё не подключена.') }}
        </template>
      </p>
      <v-btn color="primary" variant="tonal" to="/tests">{{ t('Ortga', 'Назад') }}</v-btn>
    </v-card>

    <template v-else-if="quiz">
      <header class="page-head">
        <h1 class="text-h4">{{ quiz.title }}</h1>
        <p class="text-body-2 text-medium-emphasis mb-0" style="max-width: 70ch">{{ quiz.description }}</p>
      </header>

      <v-card
        class="surface-card pa-3 px-4 mb-4 d-flex align-center progress-bar"
        rounded="lg"
        style="gap: 14px"
      >
        <span class="text-caption font-weight-bold text-no-wrap">{{ answered }} / {{ total }}</span>
        <v-progress-linear :model-value="progress" height="8" rounded color="primary" bg-color="surface-variant" />
        <v-btn
          v-if="!agreeQuiz"
          size="small"
          color="primary"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="submit"
        >
          {{ t('Yakunlash', 'Завершить') }}
        </v-btn>
      </v-card>

      <!-- ============ agree / disagree statements ============ -->
      <template v-if="agreeQuiz && currentBlock">
        <div class="d-flex align-center flex-wrap mb-4" style="gap: 8px">
          <v-chip
            v-for="(b, bi) in agreeQuiz.blocks"
            :key="b.key"
            size="small"
            :variant="bi === blockIndex ? 'flat' : 'tonal'"
            :color="bi === blockIndex ? 'primary' : undefined"
            @click="blockIndex = bi"
          >
            {{ t('Blok', 'Блок') }} {{ bi + 1 }}
            <v-icon
              v-if="agreeQuiz.blocks[bi].statements.every((_s, si) => answers[`${b.key}:${si}`] !== undefined)"
              icon="mdi-check"
              size="13"
              end
            />
          </v-chip>
          <span class="text-caption text-medium-emphasis ml-1">
            {{ blockAnswered }} / {{ currentBlock.statements.length }}
          </span>
        </div>

        <v-card class="surface-card overflow-hidden" rounded="lg">
          <div
            v-for="(s, i) in currentBlock.statements"
            :key="i"
            class="stmt-row"
            :class="{ 'stmt-row--done': answers[`${currentBlock.key}:${i}`] !== undefined }"
          >
            <span class="stmt-num">{{ i + 1 }}</span>
            <span class="stmt-text text-body-2">{{ s }}</span>
            <div class="yn-group">
              <button
                type="button"
                class="yn-btn yn-yes"
                :class="{ 'yn-btn--on': answers[`${currentBlock.key}:${i}`] === 1 }"
                :aria-pressed="answers[`${currentBlock.key}:${i}`] === 1"
                @click="setAgree(currentBlock.key, i, 1)"
              >
                <v-icon icon="mdi-check-bold" size="16" />
                {{ t('Ha', 'Да') }}
              </button>
              <button
                type="button"
                class="yn-btn yn-no"
                :class="{ 'yn-btn--on': answers[`${currentBlock.key}:${i}`] === 0 }"
                :aria-pressed="answers[`${currentBlock.key}:${i}`] === 0"
                @click="setAgree(currentBlock.key, i, 0)"
              >
                <v-icon icon="mdi-close-thick" size="16" />
                {{ t('Yo‘q', 'Нет') }}
              </button>
            </div>
          </div>
        </v-card>

        <div class="d-flex justify-space-between mt-4">
          <v-btn variant="text" prepend-icon="mdi-arrow-left" :disabled="blockIndex === 0" @click="blockIndex--">
            {{ t('Oldingi', 'Назад') }}
          </v-btn>
          <v-btn
            v-if="blockIndex < agreeQuiz.blocks.length - 1"
            color="primary"
            variant="tonal"
            append-icon="mdi-arrow-right"
            @click="blockIndex++"
          >
            {{ t('Keyingi blok', 'Следующий блок') }}
          </v-btn>
          <v-btn v-else color="primary" :loading="submitting" :disabled="!canSubmit" @click="submit">
            {{ t('Yakunlash', 'Завершить') }}
          </v-btn>
        </div>
      </template>

      <!-- ============ single choice ============ -->
      <template v-else-if="choiceQuiz">
        <v-card
          v-for="(q, qi) in choiceQuiz.questions"
          :key="qi"
          class="surface-card pa-4 pa-md-5 mb-3"
          rounded="lg"
        >
          <div class="d-flex align-start mb-3" style="gap: 10px">
            <span class="stmt-num">{{ qi + 1 }}</span>
            <span class="text-body-1 font-weight-medium">{{ q.text }}</span>
          </div>
          <div class="d-flex flex-column" style="gap: 8px">
            <button
              v-for="(opt, oi) in q.options"
              :key="oi"
              type="button"
              class="choice-row"
              :class="{ 'choice-row--on': answers[`q${qi}`] === oi }"
              @click="setChoice(qi, oi)"
            >
              <v-icon
                :icon="answers[`q${qi}`] === oi ? 'mdi-radiobox-marked' : 'mdi-radiobox-blank'"
                size="18"
                :color="answers[`q${qi}`] === oi ? 'primary' : undefined"
              />
              <span class="text-body-2">{{ opt.text }}</span>
            </button>
          </div>
        </v-card>

        <v-btn color="primary" size="large" block class="mt-2" :loading="submitting" :disabled="!canSubmit" @click="submit">
          {{ t('Yakunlash', 'Завершить') }}
        </v-btn>
      </template>

      <!-- ============ score scale (Zung SDS, …) ============ -->
      <template v-else-if="scaleQuiz">
        <v-card
          v-for="(q, qi) in scaleQuiz.questions"
          :key="qi"
          class="surface-card pa-4 pa-md-5 mb-3"
          rounded="lg"
        >
          <div class="d-flex align-start mb-3" style="gap: 10px">
            <span class="stmt-num">{{ qi + 1 }}</span>
            <span class="text-body-1 font-weight-medium">{{ q.text }}</span>
          </div>
          <div class="d-flex flex-column" style="gap: 8px">
            <button
              v-for="(label, oi) in scaleQuiz.scale"
              :key="oi"
              type="button"
              class="choice-row"
              :class="{ 'choice-row--on': answers[`q${qi}`] === oi }"
              @click="setChoice(qi, oi)"
            >
              <v-icon
                :icon="answers[`q${qi}`] === oi ? 'mdi-radiobox-marked' : 'mdi-radiobox-blank'"
                size="18"
                :color="answers[`q${qi}`] === oi ? 'primary' : undefined"
              />
              <span class="text-body-2">{{ label }}</span>
            </button>
          </div>
        </v-card>

        <v-btn color="primary" size="large" block class="mt-2" :loading="submitting" :disabled="!canSubmit" @click="submit">
          {{ t('Yakunlash', 'Завершить') }}
        </v-btn>
      </template>

      <!-- ============ figure choice ============ -->
      <template v-else-if="figureQuiz">
        <v-row>
          <v-col v-for="(fig, fi) in figureQuiz.figures" :key="fig.key" cols="6" sm="4">
            <button
              type="button"
              class="figure-card"
              :class="{ 'figure-card--on': answers.selected === fi }"
              @click="setFigure(fi)"
            >
              <v-icon v-if="answers.selected === fi" icon="mdi-check-circle" class="figure-check" color="primary" />
              <svg viewBox="0 0 64 64" class="fig-svg">
                <circle v-if="fig.key === 'Doira'" cx="32" cy="32" r="20" />
                <path v-else :d="figureShape[fig.key]" />
              </svg>
              <span class="text-body-2 font-weight-bold">{{ fig.label }}</span>
            </button>
          </v-col>
        </v-row>
        <p class="text-caption text-medium-emphasis mt-3">
          {{ t('Eng yoqadigan bitta figurani tanlang.', 'Выберите одну самую приятную фигуру.') }}
        </p>
        <v-btn color="primary" size="large" class="mt-2" :loading="submitting" :disabled="!canSubmit" @click="submit">
          {{ t('Yakunlash', 'Завершить') }}
        </v-btn>
      </template>
    </template>
  </div>
</template>

<style scoped>
.progress-bar {
  position: sticky;
  top: 76px;
  z-index: 3;
}

/* --- agree statement rows --- */
.stmt-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.7));
  transition: background 0.12s var(--ease);
}
.stmt-row:last-child {
  border-bottom: none;
}
.stmt-row--done {
  background: rgba(var(--v-theme-primary), 0.04);
}
.stmt-num {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stmt-text {
  flex-grow: 1;
  min-width: 0;
}

.yn-group {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.yn-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 15px;
  min-width: 76px;
  justify-content: center;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 2px solid rgba(var(--v-border-color), 0.28);
  background: transparent;
  color: rgb(var(--v-theme-on-surface-variant));
  cursor: pointer;
  transition: all 0.12s var(--ease);
}
.yn-btn .v-icon {
  opacity: 0.45;
}
.yn-btn:hover {
  border-color: rgba(var(--v-border-color), 0.55);
}

/* Selected states — deliberately distinct in colour, fill AND weight so a
   low-vision or colour-blind user can tell "Ha" from "Yo'q" at a glance.
   "Ha" = green fill, "Yo'q" = solid dark (near-inverse) fill. */
.yn-btn--on {
  font-weight: 800;
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.14);
}
.yn-btn--on .v-icon {
  opacity: 1;
}
.yn-yes.yn-btn--on {
  background: rgb(var(--v-theme-success));
  border-color: rgb(var(--v-theme-success));
  color: #fff;
  box-shadow: 0 0 0 3px rgba(var(--v-theme-success), 0.22);
}
.yn-no.yn-btn--on {
  background: rgb(var(--v-theme-on-surface));
  border-color: rgb(var(--v-theme-on-surface));
  color: rgb(var(--v-theme-surface));
  box-shadow: 0 0 0 3px rgba(var(--v-border-color), 0.2);
}

@media (max-width: 640px) {
  .stmt-row {
    flex-wrap: wrap;
  }
  .yn-group {
    width: 100%;
    padding-left: 36px;
  }
  .yn-btn {
    flex: 1;
    justify-content: center;
  }
}

/* --- single choice rows --- */
.choice-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 11px 13px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
  transition: border-color 0.12s var(--ease), background 0.12s var(--ease);
}
.choice-row:hover {
  border-color: rgb(var(--v-theme-primary));
}
.choice-row--on {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.06);
}

/* --- figure choice cards --- */
.figure-card {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 12px;
  border-radius: var(--radius);
  border: 1.5px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
  transition: border-color 0.14s var(--ease), transform 0.14s var(--ease), box-shadow 0.14s var(--ease);
}
.figure-card:hover {
  border-color: rgb(var(--v-theme-primary));
  transform: translateY(-2px);
}
.figure-card--on {
  border-color: rgb(var(--v-theme-primary));
  border-width: 2px;
  box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.12);
}
.figure-check {
  position: absolute;
  top: 8px;
  right: 8px;
}
.fig-svg {
  width: 72px;
  height: 72px;
  color: rgb(var(--v-theme-primary));
  stroke: currentColor;
  stroke-width: 3;
  fill: none;
  stroke-linejoin: round;
  stroke-linecap: round;
}
</style>
