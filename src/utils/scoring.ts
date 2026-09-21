import type { AnswerMap, RunnableQuiz } from '@/types/assessment'

/** How many of the quiz's items have been answered. */
export function answeredCount(quiz: RunnableQuiz, answers: AnswerMap): number {
  if (quiz.format === 'agree_statements') {
    return quiz.blocks.reduce(
      (n, b) => n + b.statements.filter((_s, i) => answers[`${b.key}:${i}`] !== undefined).length,
      0,
    )
  }
  if (quiz.format === 'single_choice' || quiz.format === 'scale_choice') {
    return quiz.questions.filter((_q, i) => answers[`q${i}`] !== undefined).length
  }
  if (quiz.format === 'ranking_list') {
    return quiz.items.filter((_it, i) => answers[`q${i}`] !== undefined).length
  }
  // figure_choice — one pick
  return answers.selected !== undefined ? 1 : 0
}

export function totalItems(quiz: RunnableQuiz): number {
  if (quiz.format === 'agree_statements') return quiz.blocks.reduce((n, b) => n + b.statements.length, 0)
  if (quiz.format === 'single_choice' || quiz.format === 'scale_choice') return quiz.questions.length
  if (quiz.format === 'ranking_list') return quiz.items.length
  return 1
}
