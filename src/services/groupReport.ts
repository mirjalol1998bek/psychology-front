import type { InstrumentType, StudyLanguage } from '@/types/domain'
import type { PassportData } from '@/stores/passport'
import { api } from '@/services/apiClient'
import { members, loadCategoriesForInstrument } from '@/services/quizService'

/**
 * Staff group reports — merges the per-instrument result rows
 * (GET /api/admin/group_results) with each student's passport
 * (GET /api/student_passports?student.studyGroup=…) by student id.
 */

interface ApiResultRow {
  studentId: number
  hemisId: string | null
  fullName: string
  resultKey: string
  label: string
  score: number | null
}

export interface GroupRow {
  studentId: number
  hemisId: string | null
  fullName: string
  temperament: string | null
  figure: string | null
  passport: PassportData | null
  /** Psixolog beradi — `PassportData`ning bir qismi emas (talaba yozmaydi). */
  personalCode: string | null
}

async function resultRows(groupId: string, instrument: InstrumentType, lang: StudyLanguage): Promise<ApiResultRow[]> {
  const category = await loadCategoriesForInstrument(instrument, lang)
  if (!category) return []
  const { data } = await api.get('/admin/group_results', {
    params: { studyGroup: groupId, category: category.id },
  })
  return (data as ApiResultRow[]) ?? []
}

interface ApiPassport {
  studentId?: number
  personalCode?: string | null
  birthDate?: string | null
  gender?: PassportData['gender'] | null
  permanentAddress?: string | null
  livingArrangement?: PassportData['livingArrangement'] | null
  commuteMinutes?: number | null
  familyStatus?: PassportData['familyStatus'] | null
  familyType?: PassportData['familyType'] | null
  siblingsCount?: number | null
  birthOrder?: number | null
  fatherInfo?: string | null
  motherInfo?: string | null
  financialStatus?: PassportData['financialStatus'] | null
  educationForm?: PassportData['educationForm'] | null
  workStatus?: PassportData['workStatus'] | null
  priorEducation?: string | null
  gpaScore?: string | null
  languageLevel?: string | null
  extracurricular?: string | null
  leisureActivity?: string | null
  healthLimitations?: string | null
  priorPsychologistVisit?: boolean | null
  currentConcern?: string | null
  updatedAt?: string | null
}

function toPassport(p: ApiPassport): PassportData {
  return {
    birthDate: (p.birthDate ?? '').slice(0, 10),
    gender: p.gender ?? '',
    permanentAddress: p.permanentAddress ?? '',
    livingArrangement: p.livingArrangement ?? '',
    commuteMinutes: p.commuteMinutes != null ? String(p.commuteMinutes) : '',
    familyStatus: p.familyStatus ?? '',
    familyType: p.familyType ?? '',
    siblingsCount: p.siblingsCount != null ? String(p.siblingsCount) : '',
    birthOrder: p.birthOrder != null ? String(p.birthOrder) : '',
    fatherInfo: p.fatherInfo ?? '',
    motherInfo: p.motherInfo ?? '',
    financialStatus: p.financialStatus ?? '',
    educationForm: p.educationForm ?? '',
    workStatus: p.workStatus ?? '',
    priorEducation: p.priorEducation ?? '',
    gpaScore: p.gpaScore ?? '',
    languageLevel: p.languageLevel ?? '',
    extracurricular: p.extracurricular ?? '',
    leisureActivity: p.leisureActivity ?? '',
    healthLimitations: p.healthLimitations ?? '',
    priorPsychologistVisit: p.priorPsychologistVisit ?? null,
    currentConcern: p.currentConcern ?? '',
    updatedAt: p.updatedAt ?? '',
  }
}

export interface GroupPassport {
  passport: PassportData
  personalCode: string | null
}

/**
 * Guruhning to'ldirilgan anketalari, talaba id bo'yicha. `itemsPerPage`siz API
 * faqat 30 tasini qaytarardi — katta guruhda qolganlari tushib qolardi.
 */
export async function fetchGroupPassports(groupId: string): Promise<Map<number, GroupPassport>> {
  const { data } = await api.get('/student_passports', {
    params: { 'student.studyGroup': groupId, itemsPerPage: 500 },
  })

  return new Map(
    members<ApiPassport>(data)
      .filter((p) => p.studentId != null)
      .map((p) => [p.studentId as number, { passport: toPassport(p), personalCode: p.personalCode ?? null }]),
  )
}

export async function fetchGroupOverview(groupId: string, lang: StudyLanguage): Promise<GroupRow[]> {
  const [temperament, figure, passports] = await Promise.all([
    resultRows(groupId, 'FREQUENCY_BASED', lang),
    resultRows(groupId, 'RANKING_BASED', lang),
    fetchGroupPassports(groupId).catch(() => new Map<number, GroupPassport>()),
  ])

  const figureBy = new Map(figure.map((r) => [r.studentId, r]))

  return temperament.map((t) => {
    const entry = passports.get(t.studentId)
    return {
      studentId: t.studentId,
      hemisId: t.hemisId,
      fullName: t.fullName,
      temperament: t.resultKey || null,
      figure: figureBy.get(t.studentId)?.resultKey || null,
      passport: entry?.passport ?? null,
      personalCode: entry?.personalCode ?? null,
    }
  })
}
