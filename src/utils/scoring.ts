import type { AnswerMap, AttemptResult, RunnableQuiz } from '@/types/assessment'
import type { StudyLanguage } from '@/types/domain'
import { TEMPERAMENT_DESCRIPTIONS, FIGURE_DESCRIPTIONS } from '@/data/assessments/descriptions'

/**
 * Score a completed attempt. This is what the backend will eventually do —
 * kept as a pure function so the take-test flow, the service layer and any
 * future server can all share one implementation.
 */
export function scoreAttempt(quiz: RunnableQuiz, answers: AnswerMap, language: StudyLanguage): AttemptResult {
  if (quiz.format === 'agree_statements') {
    const counts = quiz.blocks.map((b) => ({
      label: b.label,
      value: b.statements.reduce((n, _s, i) => n + (answers[`${b.key}:${i}`] === 1 ? 1 : 0), 0),
    }))
    const top = [...counts].sort((a, b) => b.value - a.value)[0]
    return {
      label: top.label,
      description: TEMPERAMENT_DESCRIPTIONS[top.label as keyof typeof TEMPERAMENT_DESCRIPTIONS][language],
      breakdown: counts,
    }
  }

  if (quiz.format === 'single_choice') {
    const tally: Record<string, number> = {}
    quiz.questions.forEach((q, i) => {
      const chosen = q.options[answers[`q${i}`]]
      if (chosen) tally[chosen.category] = (tally[chosen.category] ?? 0) + 1
    })
    const order = ['Xolerik', 'Sangvinik', 'Flegmatik', 'Melanxolik']
    const breakdown = order.map((label) => ({ label, value: tally[label] ?? 0 }))
    const top = [...breakdown].sort((a, b) => b.value - a.value)[0]
    return {
      label: top.label,
      description: TEMPERAMENT_DESCRIPTIONS[top.label as keyof typeof TEMPERAMENT_DESCRIPTIONS][language],
      breakdown,
    }
  }

  // figure_choice — the picked figure is the result
  const chosen = quiz.figures[answers.selected] ?? quiz.figures[0]
  return {
    label: chosen.key,
    description: FIGURE_DESCRIPTIONS[chosen.key][language],
    breakdown: [],
  }
}

/** How many of the quiz's items have been answered. */
export function answeredCount(quiz: RunnableQuiz, answers: AnswerMap): number {
  if (quiz.format === 'agree_statements') {
    return quiz.blocks.reduce(
      (n, b) => n + b.statements.filter((_s, i) => answers[`${b.key}:${i}`] !== undefined).length,
      0,
    )
  }
  if (quiz.format === 'single_choice') {
    return quiz.questions.filter((_q, i) => answers[`q${i}`] !== undefined).length
  }
  // figure_choice — one pick
  return answers.selected !== undefined ? 1 : 0
}

export function totalItems(quiz: RunnableQuiz): number {
  if (quiz.format === 'agree_statements') return quiz.blocks.reduce((n, b) => n + b.statements.length, 0)
  if (quiz.format === 'single_choice') return quiz.questions.length
  return 1
}
