import type { InstrumentType, StudyLanguage } from '@/types/domain'
import type { RunnableQuiz } from '@/types/assessment'
import { temperamentUz } from '@/data/assessments/temperament-uz'
import { temperamentRu } from '@/data/assessments/temperament-ru'
import { psychogeometricUz, psychogeometricRu } from '@/data/assessments/psychogeometric'

/**
 * Quiz catalogue. Currently resolves from local fixtures with a small delay
 * so the call sites are already async; swap the bodies for `axios` against
 * the psixologiya API when it exists — the signatures stay the same.
 */

const ALL: RunnableQuiz[] = [temperamentUz, temperamentRu, psychogeometricUz, psychogeometricRu]

const delay = <T>(value: T, ms = 180) => new Promise<T>((r) => setTimeout(() => r(value), ms))

export interface QuizSummary {
  instrumentType: InstrumentType
  title: string
  description: string
  /** total answerable items — statements / questions / figures */
  itemCount: number
  available: boolean
}

/** Instruments a student sees, in the order the platform presents them. */
export async function listInstruments(language: StudyLanguage): Promise<QuizSummary[]> {
  const summaries: QuizSummary[] = [
    summaryFor('FREQUENCY_BASED', language),
    summaryFor('RANKING_BASED', language),
    {
      instrumentType: 'SCORE_RANGE_BASED',
      title: 'Nevrasteniya so‘rovnomasi',
      description: 'Bu metodika hali platformaga ulanmagan.',
      itemCount: 0,
      available: false,
    },
  ]
  return delay(summaries)
}

function summaryFor(instrumentType: InstrumentType, language: StudyLanguage): QuizSummary {
  const quiz = pick(instrumentType, language)
  let itemCount = 0
  if (quiz) {
    if (quiz.format === 'agree_statements') itemCount = quiz.blocks.reduce((n, b) => n + b.statements.length, 0)
    else if (quiz.format === 'single_choice') itemCount = quiz.questions.length
    else itemCount = 1
  }
  return {
    instrumentType,
    title: quiz?.title ?? '',
    description: quiz?.description ?? '',
    itemCount,
    available: !!quiz,
  }
}

function pick(instrumentType: InstrumentType, language: StudyLanguage): RunnableQuiz | undefined {
  const langMatch = ALL.filter((q) => q.instrumentType === instrumentType)
  return langMatch.find((q) => q.language === language) ?? langMatch.find((q) => q.language === 'uz')
}

/** Resolve the concrete quiz for an instrument + the student's language. */
export async function getQuiz(instrumentType: InstrumentType, language: StudyLanguage): Promise<RunnableQuiz | null> {
  return delay(pick(instrumentType, language) ?? null)
}
