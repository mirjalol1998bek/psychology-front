import type { InstrumentType, StudyLanguage } from '@/types/domain'
import type { AnswerMap, AttemptResult, RunnableQuiz, StoredAttempt } from '@/types/assessment'
import { api } from '@/services/apiClient'
import {
  fetchBackendQuiz,
  instrumentForAlgo,
  isRenderableAlgo,
  loadCategoriesForInstrument,
  members,
  toRunnableQuiz,
  type QuizRef,
} from '@/services/quizService'

/**
 * Test-taking lifecycle against the backend:
 *   startTest  → POST /attempts/start {categoryId}  (needs an open Assignment)
 *   saveTest   → POST /attempts/{id}/answers        (full replace, debounced)
 *   submitTest → POST /attempts/{id}/submit         (scores server-side)
 *   resetTest  → POST /attempts/{id}/reset
 *
 * The index-based AnswerMap is translated to/from `{questionId, optionIds}`
 * using the QuizRef that startTest returns.
 */

interface BackendResult {
  label: string
  description: string
  score: number | null
  breakdown: { label: string; value: number }[]
}
interface BackendAttempt {
  id: number
  status: 'not_started' | 'in_progress' | 'submitted' | 'reviewed'
  quiz?: { id: number; category?: { instrumentType?: string } }
  result?: BackendResult | null
  answers?: { questionId: number; selectedOptionIds: number[] }[]
  createdAt?: string
  updatedAt?: string
  submittedAt?: string | null
}

function toResult(r: BackendResult | null | undefined): AttemptResult | undefined {
  if (!r) return undefined
  return { label: r.label, description: r.description, breakdown: r.breakdown ?? [] }
}

function toStoredAttempt(a: BackendAttempt): StoredAttempt {
  const submitted = a.status === 'submitted' || a.status === 'reviewed'
  return {
    id: a.id,
    quizId: a.quiz?.id != null ? String(a.quiz.id) : '',
    instrumentType: instrumentForAlgo(a.quiz?.category?.instrumentType),
    status: submitted ? 'submitted' : 'in_progress',
    answers: {},
    result: toResult(a.result),
    updatedAt: a.updatedAt ?? a.createdAt ?? '',
    submittedAt: a.submittedAt ?? undefined,
  }
}

export async function getAttempts(_studentKey?: string): Promise<StoredAttempt[]> {
  const raw = members<BackendAttempt>((await api.get('/attempts')).data)
  return raw.map(toStoredAttempt)
}

export async function getAttempt(_studentKey: string, instrument: InstrumentType): Promise<StoredAttempt | null> {
  const all = await getAttempts()
  return all.find((a) => a.instrumentType === instrument) ?? null
}

// --- take-test lifecycle ---------------------------------------------------

export type StartTestResult =
  | { unavailable: true; reason: 'not_assigned' | 'not_configured' | 'error' }
  | {
      unavailable?: false
      status: 'in_progress' | 'submitted'
      attemptId: number
      quiz: RunnableQuiz
      ref: QuizRef
      savedAnswers: AnswerMap
    }

export async function startTest(instrument: InstrumentType, language: StudyLanguage): Promise<StartTestResult> {
  const category = await loadCategoriesForInstrument(instrument, language)
  if (!category) return { unavailable: true, reason: 'not_configured' }
  if (!isRenderableAlgo(category.instrumentType)) return { unavailable: true, reason: 'not_configured' }

  let attempt: BackendAttempt
  try {
    attempt = (await api.post('/attempts/start', { categoryId: category.id })).data as BackendAttempt
  } catch (e) {
    const status = (e as { response?: { status?: number } }).response?.status
    if (status === 403) return { unavailable: true, reason: 'not_assigned' }
    return { unavailable: true, reason: 'error' }
  }

  const bq = await fetchBackendQuiz(category.id, language)
  if (!bq) return { unavailable: true, reason: 'not_configured' }
  const { quiz, ref } = toRunnableQuiz(bq, language)

  const submitted = attempt.status === 'submitted' || attempt.status === 'reviewed'
  const full = submitted ? attempt : ((await api.get(`/attempts/${attempt.id}`)).data as BackendAttempt)

  return {
    status: submitted ? 'submitted' : 'in_progress',
    attemptId: attempt.id,
    quiz,
    ref,
    savedAnswers: decodeAnswers(ref, full.answers ?? []),
  }
}

export async function saveTest(
  attemptId: number,
  quiz: RunnableQuiz,
  answers: AnswerMap,
  ref: QuizRef,
): Promise<void> {
  await api.post(`/attempts/${attemptId}/answers`, { answers: encodeAnswers(quiz, answers, ref) })
}

export async function submitTest(attemptId: number): Promise<StoredAttempt> {
  const a = (await api.post(`/attempts/${attemptId}/submit`, null)).data as BackendAttempt
  return toStoredAttempt(a)
}

/** Staff only — clears a student's attempt so they can take the test again. */
export async function resetTest(attemptId: number): Promise<void> {
  await api.post(`/attempts/${attemptId}/reset`, null)
}

/** Admin only — deletes a student's attempt + result entirely. */
export async function deleteAttempt(attemptId: number): Promise<void> {
  await api.delete(`/attempts/${attemptId}`)
}

// --- AnswerMap <-> backend payload ---------------------------------------

function encodeAnswers(
  quiz: RunnableQuiz,
  answers: AnswerMap,
  ref: QuizRef,
): { questionId: number; optionIds: number[] }[] {
  const out: { questionId: number; optionIds: number[] }[] = []
  const push = (key: string, value: number | undefined) => {
    if (value === undefined) return
    const item = ref.items[key]
    const optionId = item?.optionIds[value]
    if (item && optionId != null) out.push({ questionId: item.questionId, optionIds: [optionId] })
  }

  if (quiz.format === 'agree_statements') {
    for (const b of quiz.blocks) b.statements.forEach((_s, i) => push(`${b.key}:${i}`, answers[`${b.key}:${i}`]))
  } else if (quiz.format === 'single_choice' || quiz.format === 'scale_choice') {
    quiz.questions.forEach((_q, i) => push(`q${i}`, answers[`q${i}`]))
  } else {
    push('selected', answers.selected)
  }
  return out
}

function decodeAnswers(ref: QuizRef, backendAnswers: { questionId: number; selectedOptionIds: number[] }[]): AnswerMap {
  const byQuestion: Record<number, { key: string; optionIds: number[] }> = {}
  for (const [key, item] of Object.entries(ref.items)) byQuestion[item.questionId] = { key, optionIds: item.optionIds }

  const map: AnswerMap = {}
  for (const a of backendAnswers) {
    const entry = byQuestion[a.questionId]
    if (!entry) continue
    const idx = entry.optionIds.indexOf(a.selectedOptionIds[0])
    if (idx >= 0) map[entry.key] = idx
  }
  return map
}
