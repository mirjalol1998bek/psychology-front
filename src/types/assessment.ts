import type { InstrumentType, StudyLanguage } from './domain'

/**
 * Runnable assessment definitions — the JSON/TS fixtures the take-test flow
 * renders and scores. Shaped so a real API can return the same objects later
 * (see src/services/*). Result labels deliberately match the keys in
 * src/utils/instruments.ts (TEMPERAMENT_OPTIONS / SHAPE_OPTIONS) so the
 * existing badge/colour/render pipeline works unchanged.
 */

export type TemperamentKey = 'Xolerik' | 'Sangvinik' | 'Flegmatik' | 'Melanxolik'
export type FigureKey = 'Kvadrat' | 'Uchburchak' | "To'g'ri to'rtburchak" | 'Doira' | 'Zigzag'

/** Temperament, "agree / disagree with each statement" form (uz handout). */
export interface AgreeStatementsQuiz {
  id: string
  instrumentType: 'FREQUENCY_BASED'
  format: 'agree_statements'
  language: StudyLanguage
  title: string
  description: string
  /** Four blocks; the block with the most "agree" answers is the result. */
  blocks: { key: TemperamentKey; label: string; statements: string[] }[]
}

/** Temperament, single-choice per question form (ru groups). */
export interface SingleChoiceQuiz {
  id: string
  instrumentType: 'FREQUENCY_BASED'
  format: 'single_choice'
  language: StudyLanguage
  title: string
  description: string
  /** The category chosen most often across questions is the result. */
  questions: { text: string; options: { text: string; category: TemperamentKey }[] }[]
}

/** Psychogeometric — the student picks the one figure they like most; that
 *  figure is the result. (The paper form ranks all five, but only the first
 *  choice determines the type, so a single pick is equivalent.) */
export interface FigureChoiceQuiz {
  id: string
  instrumentType: 'RANKING_BASED'
  format: 'figure_choice'
  language: StudyLanguage
  title: string
  description: string
  figures: { key: FigureKey; label: string; icon: string }[]
}

/** Score scale (e.g. Zung SDS) — every question uses the same ordered scale
 *  of frequency options; the backend sums the option scores (reverse-scoring
 *  the questions flagged as such) and maps the total to a range. */
export interface ScaleChoiceQuiz {
  id: string
  instrumentType: 'SCORE_RANGE_BASED'
  format: 'scale_choice'
  language: StudyLanguage
  title: string
  description: string
  /** Shared option labels, lowest → highest, one column per question. */
  scale: string[]
  questions: { text: string }[]
}

export type RunnableQuiz = AgreeStatementsQuiz | SingleChoiceQuiz | FigureChoiceQuiz | ScaleChoiceQuiz

// ---------------------------------------------------------------------------
// Attempts
// ---------------------------------------------------------------------------

export type AttemptStatus = 'in_progress' | 'submitted'

/** agree_statements: `${blockKey}:${index}` → 0 | 1
 *  single_choice / scale_choice: `q${index}` → chosen option index
 *  figure_choice:    `selected` → chosen figure index */
export type AnswerMap = Record<string, number>

export interface AttemptResult {
  /** "Sangvinik" / "Doira" — the label the badge/table pipeline expects. */
  label: string
  /** Full free-text interpretation the student reads afterwards. */
  description: string
  /** Per-category counts (temperament); empty for a single figure choice. */
  breakdown: { label: string; value: number }[]
}

export interface StoredAttempt {
  /** Backend Attempt id (present when loaded from the API). */
  id?: number
  quizId: string
  instrumentType: InstrumentType
  status: AttemptStatus
  answers: AnswerMap
  result?: AttemptResult
  updatedAt: string
  submittedAt?: string
}
