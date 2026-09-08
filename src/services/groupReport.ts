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
  birthDate?: string | null
  currentAddress?: string | null
  phone?: string | null
  familyStatus?: PassportData['familyStatus'] | null
  livingEnvironment?: PassportData['livingEnvironment'] | null
  talents?: string | null
  parentsInfo?: string | null
  tutorInfo?: string | null
  updatedAt?: string | null
}

function toPassport(p: ApiPassport): PassportData {
  return {
    birthDate: (p.birthDate ?? '').slice(0, 10),
    currentAddress: p.currentAddress ?? '',
    phone: p.phone ?? '',
    familyStatus: p.familyStatus ?? '',
    livingEnvironment: p.livingEnvironment ?? '',
    talents: p.talents ?? '',
    parentsInfo: p.parentsInfo ?? '',
    tutorInfo: p.tutorInfo ?? '',
    updatedAt: p.updatedAt ?? '',
  }
}

export async function fetchGroupOverview(groupId: string, lang: StudyLanguage): Promise<GroupRow[]> {
  const [temperament, figure, passports] = await Promise.all([
    resultRows(groupId, 'FREQUENCY_BASED', lang),
    resultRows(groupId, 'RANKING_BASED', lang),
    api
      .get('/student_passports', { params: { 'student.studyGroup': groupId } })
      .then((r) => members<ApiPassport>(r.data))
      .catch(() => [] as ApiPassport[]),
  ])

  const figureBy = new Map(figure.map((r) => [r.studentId, r]))
  const passportBy = new Map(passports.filter((p) => p.studentId != null).map((p) => [p.studentId as number, toPassport(p)]))

  return temperament.map((t) => ({
    studentId: t.studentId,
    hemisId: t.hemisId,
    fullName: t.fullName,
    temperament: t.resultKey || null,
    figure: figureBy.get(t.studentId)?.resultKey || null,
    passport: passportBy.get(t.studentId) ?? null,
  }))
}
