import type { InstrumentType, StudyLanguage } from '@/types/domain'
import type { AnswerMap, RunnableQuiz, StoredAttempt } from '@/types/assessment'
import { INSTRUMENT_META } from '@/utils/instruments'
import { scoreAttempt } from '@/utils/scoring'

/**
 * Attempts live in localStorage, keyed by the student's HEMIS id — so an
 * admin "viewing as" a student, and that student themselves, share the same
 * record. Scoring runs here (simulating the backend). Swap the storage for
 * HTTP calls later; the async signatures already fit.
 */

const KEY = (studentKey: string) => `psy.attempts.${studentKey}`
const seg = (t: InstrumentType) => INSTRUMENT_META[t].routeSegment

type Bucket = Record<string, StoredAttempt> // routeSegment → attempt

function read(studentKey: string): Bucket {
  try {
    return JSON.parse(localStorage.getItem(KEY(studentKey)) ?? '{}')
  } catch {
    return {}
  }
}

function write(studentKey: string, bucket: Bucket) {
  try {
    localStorage.setItem(KEY(studentKey), JSON.stringify(bucket))
  } catch {
    /* non-fatal for a demo */
  }
}

const delay = <T>(v: T, ms = 120) => new Promise<T>((r) => setTimeout(() => r(v), ms))

export async function getAttempts(studentKey: string): Promise<StoredAttempt[]> {
  return delay(Object.values(read(studentKey)))
}

export async function getAttempt(studentKey: string, instrument: InstrumentType): Promise<StoredAttempt | null> {
  return delay(read(studentKey)[seg(instrument)] ?? null)
}

export async function saveDraft(studentKey: string, instrument: InstrumentType, answers: AnswerMap): Promise<void> {
  const bucket = read(studentKey)
  const existing = bucket[seg(instrument)]
  if (existing?.status === 'submitted') return
  bucket[seg(instrument)] = {
    quizId: existing?.quizId ?? '',
    instrumentType: instrument,
    status: 'in_progress',
    answers,
    updatedAt: new Date().toISOString(),
  }
  write(studentKey, bucket)
  return delay(undefined, 0)
}

export async function submitAttempt(
  studentKey: string,
  quiz: RunnableQuiz,
  answers: AnswerMap,
  language: StudyLanguage,
): Promise<StoredAttempt> {
  const result = scoreAttempt(quiz, answers, language)
  const attempt: StoredAttempt = {
    quizId: quiz.id,
    instrumentType: quiz.instrumentType,
    status: 'submitted',
    answers,
    result,
    updatedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
  }
  const bucket = read(studentKey)
  bucket[seg(quiz.instrumentType)] = attempt
  write(studentKey, bucket)
  return delay(attempt)
}

export async function resetAttempt(studentKey: string, instrument: InstrumentType): Promise<void> {
  const bucket = read(studentKey)
  delete bucket[seg(instrument)]
  write(studentKey, bucket)
  return delay(undefined, 0)
}

/**
 * The result labels a psychologist's group table needs, resolved from a
 * student's real submitted attempts (by HEMIS id). Falls back to `null`
 * for anything the student hasn't taken.
 */
export function submittedResultsFor(hemisId: string): {
  temperament: string | null
  geometricFigure: string | null
  conclusion: string | null
} {
  const bucket = read(hemisId)
  const t = bucket['temperament']
  const p = bucket['psixogeometrik']
  const n = bucket['nevrasteniya']
  return {
    temperament: t?.status === 'submitted' ? t.result?.label ?? null : null,
    geometricFigure: p?.status === 'submitted' ? p.result?.label ?? null : null,
    conclusion: n?.status === 'submitted' ? n.result?.description ?? null : null,
  }
}

export function hasAnySubmission(hemisId: string): boolean {
  return Object.values(read(hemisId)).some((a) => a.status === 'submitted')
}
