import type { InstrumentType, StudyLanguage } from '@/types/domain'
import type { FigureKey, RunnableQuiz, ScaleChoiceQuiz, TemperamentKey } from '@/types/assessment'
import { INSTRUMENT_META } from '@/utils/instruments'
import { api } from '@/services/apiClient'

/**
 * Quiz catalogue — now backed by the Symfony/API-Platform backend.
 *
 * The frontend classifies instruments into 3 render modes (InstrumentType);
 * the backend models each methodology as a `Category` with one of 4 scoring
 * algorithms (`instrumentType`). This module maps between them and turns a
 * backend Quiz (questions + options with ids) into the `RunnableQuiz` shape
 * the take-test flow renders, plus a `QuizRef` that lets attemptService
 * translate the index-based AnswerMap back into `{questionId, optionIds}`.
 */

// backend Category.instrumentType → frontend render classification
const ALGO_TO_INSTRUMENT: Record<string, InstrumentType> = {
  TEMPERAMENT_STATEMENTS: 'FREQUENCY_BASED',
  TEMPERAMENT_CHOICE: 'FREQUENCY_BASED',
  FIGURE_CHOICE: 'RANKING_BASED',
  SCORE_SCALE: 'SCORE_RANGE_BASED',
}
export function instrumentForAlgo(algo: string | undefined): InstrumentType {
  return ALGO_TO_INSTRUMENT[algo ?? ''] ?? 'FREQUENCY_BASED'
}

export interface BackendCategory {
  id: number
  name: string
  description?: string | null
  instrumentType: string
}
interface BackendOption {
  id: number
  text: string
  imageUrl?: string | null
  position: number
  score: number
  categoryKey?: string | null
}
interface BackendQuestion {
  id: number
  type: string
  text: string
  imageUrl?: string | null
  position: number
  isReversed: boolean
  options: BackendOption[]
}
export interface BackendQuiz {
  id: number
  title: string
  description?: string | null
  studyLanguage: StudyLanguage
  category: BackendCategory
  questions: BackendQuestion[]
}

/** Per-item backend ids so an index-based AnswerMap round-trips to the API. */
export interface QuizRef {
  quizId: number
  categoryId: number
  /** key → { questionId, optionIds } where optionIds is index-aligned with
   *  the rendered choices (agree: [noId, yesId]; choice/figure: option order). */
  items: Record<string, { questionId: number; optionIds: number[] }>
}

export interface QuizSummary {
  instrumentType: InstrumentType
  categoryId?: number
  title: string
  description: string
  itemCount: number
  available: boolean
}

/** API Platform Hydra collections use `member` (v4) or `hydra:member` (v3). */
export function members<T = Record<string, unknown>>(data: unknown): T[] {
  const d = data as Record<string, unknown>
  return (d?.member ?? d?.['hydra:member'] ?? []) as T[]
}

let categoryCache: BackendCategory[] | null = null
async function loadCategories(): Promise<BackendCategory[]> {
  if (!categoryCache) {
    categoryCache = members<BackendCategory>((await api.get('/categories')).data)
  }
  return categoryCache
}

export function pickCategory(
  categories: BackendCategory[],
  instrument: InstrumentType,
  language: StudyLanguage,
): BackendCategory | undefined {
  if (instrument === 'FREQUENCY_BASED') {
    const algo = language === 'ru' ? 'TEMPERAMENT_CHOICE' : 'TEMPERAMENT_STATEMENTS'
    return (
      categories.find((c) => c.instrumentType === algo) ??
      categories.find((c) => c.instrumentType === 'TEMPERAMENT_STATEMENTS') ??
      categories.find((c) => c.instrumentType === 'TEMPERAMENT_CHOICE')
    )
  }
  if (instrument === 'RANKING_BASED') return categories.find((c) => c.instrumentType === 'FIGURE_CHOICE')
  return categories.find((c) => c.instrumentType === 'SCORE_SCALE')
}

/** Instruments a student sees, with `available` reflecting an open assignment. */
export async function listInstruments(language: StudyLanguage): Promise<QuizSummary[]> {
  const [categories, assignments, quizzes] = await Promise.all([
    loadCategories(),
    api.get('/assignments').then((r) => members<{ category: { id: number } }>(r.data)),
    api.get('/quizzes').then((r) => members<{ category: { id: number }; studyLanguage: string; questionCount: number }>(r.data)),
  ])
  const openCategoryIds = new Set(assignments.map((a) => a.category?.id))
  const order: InstrumentType[] = ['FREQUENCY_BASED', 'RANKING_BASED', 'SCORE_RANGE_BASED']

  return order.map((instrument) => {
    const cat = pickCategory(categories, instrument, language)
    const quiz =
      cat &&
      (quizzes.find((q) => q.category?.id === cat.id && q.studyLanguage === language) ??
        quizzes.find((q) => q.category?.id === cat.id))
    return {
      instrumentType: instrument,
      categoryId: cat?.id,
      title: cat?.name ?? INSTRUMENT_META[instrument].label,
      description: cat?.description ?? '',
      itemCount: quiz?.questionCount ?? 0,
      available: !!cat && openCategoryIds.has(cat.id) && isRenderableAlgo(cat.instrumentType),
    }
  })
}

/** The backend Category that backs a frontend instrument for this language. */
export async function loadCategoriesForInstrument(
  instrument: InstrumentType,
  language: StudyLanguage,
): Promise<BackendCategory | undefined> {
  return pickCategory(await loadCategories(), instrument, language)
}

/** The backend Quiz for an instrument + language (full — questions + options). */
export async function fetchBackendQuiz(categoryId: number, language: StudyLanguage): Promise<BackendQuiz | null> {
  const quizzes = members<{ id: number; category: { id: number }; studyLanguage: string }>(
    (await api.get('/quizzes', { params: { category: categoryId } })).data,
  )
  const match =
    quizzes.find((q) => q.studyLanguage === language) ?? quizzes.find((q) => q.category?.id === categoryId)
  if (!match) return null
  return (await api.get(`/quizzes/${match.id}`)).data as BackendQuiz
}

/** Transform a backend Quiz into the renderable shape + its id map. */
export function toRunnableQuiz(bq: BackendQuiz, language: StudyLanguage): { quiz: RunnableQuiz; ref: QuizRef } {
  const algo = bq.category.instrumentType
  const items: QuizRef['items'] = {}
  const ref: QuizRef = { quizId: bq.id, categoryId: bq.category.id, items }
  const sortedQuestions = [...bq.questions].sort((a, b) => a.position - b.position)
  const sortOpts = (o: BackendOption[]) => [...o].sort((a, b) => a.position - b.position)

  if (algo === 'TEMPERAMENT_STATEMENTS') {
    const blockOrder: string[] = []
    const byBlock: Record<string, { text: string; qid: number; yesId: number; noId: number }[]> = {}
    for (const q of sortedQuestions) {
      const opts = sortOpts(q.options)
      const yes = opts.find((o) => o.categoryKey)
      const no = opts.find((o) => !o.categoryKey)
      const key = yes?.categoryKey ?? 'X'
      if (!byBlock[key]) {
        byBlock[key] = []
        blockOrder.push(key)
      }
      byBlock[key].push({ text: q.text, qid: q.id, yesId: yes?.id ?? 0, noId: no?.id ?? 0 })
    }
    const blocks = blockOrder.map((key) => {
      const list = byBlock[key]
      list.forEach((s, i) => {
        items[`${key}:${i}`] = { questionId: s.qid, optionIds: [s.noId, s.yesId] }
      })
      return { key: key as TemperamentKey, label: key, statements: list.map((s) => s.text) }
    })
    return {
      quiz: {
        id: `${bq.id}`,
        instrumentType: 'FREQUENCY_BASED',
        format: 'agree_statements',
        language,
        title: bq.title,
        description: bq.description ?? '',
        blocks,
      },
      ref,
    }
  }

  if (algo === 'TEMPERAMENT_CHOICE') {
    const questions = sortedQuestions.map((q, i) => {
      const opts = sortOpts(q.options)
      items[`q${i}`] = { questionId: q.id, optionIds: opts.map((o) => o.id) }
      return {
        text: q.text,
        options: opts.map((o) => ({ text: o.text, category: (o.categoryKey ?? '') as TemperamentKey })),
      }
    })
    return {
      quiz: {
        id: `${bq.id}`,
        instrumentType: 'FREQUENCY_BASED',
        format: 'single_choice',
        language,
        title: bq.title,
        description: bq.description ?? '',
        questions,
      },
      ref,
    }
  }

  if (algo === 'SCORE_SCALE') {
    const questions = sortedQuestions.map((q, i) => {
      const opts = sortOpts(q.options)
      items[`q${i}`] = { questionId: q.id, optionIds: opts.map((o) => o.id) }
      return { text: q.text }
    })
    const scale = sortOpts(sortedQuestions[0]?.options ?? []).map((o) => o.text)
    const quiz: ScaleChoiceQuiz = {
      id: `${bq.id}`,
      instrumentType: 'SCORE_RANGE_BASED',
      format: 'scale_choice',
      language,
      title: bq.title,
      description: bq.description ?? '',
      scale,
      questions,
    }
    return { quiz, ref }
  }

  // FIGURE_CHOICE — every other renderable algo has its own branch above.
  const q0 = sortedQuestions[0]
  const opts = sortOpts(q0?.options ?? [])
  items['selected'] = { questionId: q0?.id ?? 0, optionIds: opts.map((o) => o.id) }
  return {
    quiz: {
      id: `${bq.id}`,
      instrumentType: 'RANKING_BASED',
      format: 'figure_choice',
      language,
      title: bq.title,
      description: bq.description ?? '',
      figures: opts.map((o) => ({
        key: (o.categoryKey ?? o.text) as FigureKey,
        label: o.text,
        icon: o.imageUrl ?? 'mdi-shape-outline',
      })),
    },
    ref,
  }
}

/** True when the frontend can render this backend algorithm today. */
export function isRenderableAlgo(algo: string): boolean {
  return (
    algo === 'TEMPERAMENT_STATEMENTS' ||
    algo === 'TEMPERAMENT_CHOICE' ||
    algo === 'FIGURE_CHOICE' ||
    algo === 'SCORE_SCALE'
  )
}

export function clearQuizCache() {
  categoryCache = null
}
