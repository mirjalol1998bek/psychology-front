/**
 * 7-metodika: Sotsiometrik tadqiqot. Talaba tomoni (savollar/tanlov) —
 * `quizService.ts`/`TakeTestView.vue`. Bu fayl — faqat guruh hisobotini
 * ko'rsatish uchun matn (kategoriya/jipslik talqini), backend
 * `SociometryReporter.php`dagi hisoblash mantig'i bilan qo'lda sinxron.
 * Faqat o'zbek tilida — rasmiy manba shunday.
 */

export interface SociometryCategoryMeta {
  label: string
  description: string
  color: string
  icon: string
}

export const SOCIOMETRY_CATEGORIES: Record<string, SociometryCategoryMeta> = {
  yulduzlar: {
    label: 'Yulduz',
    description: 'Guruh yetakchisi. Ijobiy resurs sifatida faollashtiriladi (guruh sardori, tyutor).',
    color: 'warning',
    icon: 'mdi-star',
  },
  afzal_korilganlar: {
    label: 'Afzal ko\'rilgan',
    description: 'Guruhning barqaror yadrosi. Maxsus chora talab etilmaydi.',
    color: 'success',
    icon: 'mdi-thumb-up-outline',
  },
  ortacha: {
    label: 'O\'rtacha',
    description: '',
    color: 'default',
    icon: 'mdi-account-outline',
  },
  etibordan_chetdagilar: {
    label: 'E\'tibordan chetda',
    description: 'Ijtimoiy aloqalari zaif. Chora: jamoaviy topshiriqlarga jalb qilish.',
    color: 'info',
    icon: 'mdi-account-question-outline',
  },
  izolyatsiyadagilar: {
    label: 'Izolyatsiyada',
    description: 'Guruhdan ajralgan. Chora: majburiy individual suhbat, sababini aniqlash, guruhga integratsiya rejasi.',
    color: 'error',
    icon: 'mdi-account-alert-outline',
  },
}

export interface CohesionLevel {
  min: number
  label: string
  description: string
}

export const COHESION_LEVELS: CohesionLevel[] = [
  { min: 0.6, label: 'Yuqori', description: 'Jipslashgan, ichki aloqalari mustahkam guruh.' },
  { min: 0.4, label: 'O\'rtadan yuqori', description: 'Guruh shakllangan, ayrim zaif aloqalar mavjud.' },
  { min: 0.2, label: 'O\'rta', description: 'Guruh mikroguruhlarga bo\'lingan bo\'lishi mumkin. Jipslashtiruvchi tadbirlar tavsiya etiladi.' },
  { min: 0, label: 'Past', description: 'Guruh sifatida shakllanmagan. Kurator bilan birgalikda jamoaviy tadbirlar rejasi tuziladi.' },
]

export function cohesionLevel(cn: number): CohesionLevel {
  return COHESION_LEVELS.find((l) => cn >= l.min) ?? COHESION_LEVELS[COHESION_LEVELS.length - 1]
}
