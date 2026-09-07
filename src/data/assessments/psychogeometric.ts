import type { FigureChoiceQuiz } from '@/types/assessment'

/**
 * Psychogeometric — "Xarakterni aniqlovchi psixogeometrik test". The student
 * picks the single figure they like most; that figure is their dominant
 * type. Same figures for uz and ru groups — only the labels and result
 * interpretations differ by language (see descriptions.ts).
 */
const figuresUz: FigureChoiceQuiz['figures'] = [
  { key: 'Kvadrat', label: 'Kvadrat', icon: 'mdi-square-outline' },
  { key: 'Uchburchak', label: 'Uchburchak', icon: 'mdi-triangle-outline' },
  { key: "To'g'ri to'rtburchak", label: "To'g'ri to'rtburchak", icon: 'mdi-rectangle-outline' },
  { key: 'Doira', label: 'Doira', icon: 'mdi-circle-outline' },
  { key: 'Zigzag', label: 'Zigzag', icon: 'mdi-vector-polyline' },
]

const figuresRu: FigureChoiceQuiz['figures'] = [
  { key: 'Kvadrat', label: 'Квадрат', icon: 'mdi-square-outline' },
  { key: 'Uchburchak', label: 'Треугольник', icon: 'mdi-triangle-outline' },
  { key: "To'g'ri to'rtburchak", label: 'Прямоугольник', icon: 'mdi-rectangle-outline' },
  { key: 'Doira', label: 'Круг', icon: 'mdi-circle-outline' },
  { key: 'Zigzag', label: 'Зигзаг', icon: 'mdi-vector-polyline' },
]

export const psychogeometricUz: FigureChoiceQuiz = {
  id: 'psixogeometrik-uz',
  instrumentType: 'RANKING_BASED',
  format: 'figure_choice',
  language: 'uz',
  title: 'Psixogeometrik test',
  description:
    'Beshta geometrik figuraga diqqat bilan qarang va o‘zingizga eng yoqadigan, eng yaqin bo‘lgan bittasini tanlang. Tanlagan figurangiz sizning asosiy xarakter shaklingizni bildiradi.',
  figures: figuresUz,
}

export const psychogeometricRu: FigureChoiceQuiz = {
  id: 'psixogeometrik-ru',
  instrumentType: 'RANKING_BASED',
  format: 'figure_choice',
  language: 'ru',
  title: 'Психогеометрический тест',
  description:
    'Внимательно посмотрите на пять геометрических фигур и выберите одну — самую приятную, самую близкую вам. Выбранная фигура отражает вашу основную форму характера.',
  figures: figuresRu,
}
