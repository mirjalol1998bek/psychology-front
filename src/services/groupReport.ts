import type { InstrumentType, StudyLanguage } from '@/types/domain'
import type { PassportData } from '@/stores/passport'
import { api } from '@/services/apiClient'
import { members, loadCategoriesForInstrument } from '@/services/quizService'

/**
 * Staff group reports — merges the per-instrument result rows
 * (GET /api/admin/group_results) with each student's passport
 * (GET /api/student_passports?student.studyGroup=…) by student id.
 */

/** Tekshirish jadvali ustunlari. Sotsiometriya individual natija bermaydi — guruh tahlili alohida. */
export const OVERVIEW_INSTRUMENTS: InstrumentType[] = [
  'FREQUENCY_BASED',
  'RANKING_BASED',
  'SUBSCALE_BASED',
  'MOTIVATION_BASED',
  'RESILIENCE_BASED',
  'COMMUNICATION_BASED',
  'RISK_BASED',
  'VALUES_BASED',
  'SELF_ESTEEM_BASED',
]

interface ApiResultRow {
  studentId: number
  hemisId: string | null
  fullName: string
  resultKey: string
  label: string
  score: number | null
}

export interface ResultCell {
  resultKey: string
  /** Xulosa nomi (ball shkalali metodikalarda), temperament/shaklda — tur nomi. */
  label: string
  score: number | null
}

export interface GroupRow {
  studentId: number
  hemisId: string | null
  fullName: string
  results: Partial<Record<InstrumentType, ResultCell>>
  temperament: string | null
  figure: string | null
  passport: PassportData | null
  /** Psixolog beradi — `PassportData`ning bir qismi emas (talaba yozmaydi). */
  personalCode: string | null
}

export interface GroupOverview {
  /** Tizimda kategoriyasi bor metodikalar — jadval ustunlari shular. */
  instruments: InstrumentType[]
  rows: GroupRow[]
}

/** `null` — bu metodika tizimda (shu tilda) yo'q. */
async function resultRows(groupId: string, instrument: InstrumentType, lang: StudyLanguage): Promise<ApiResultRow[] | null> {
  const category = await loadCategoriesForInstrument(instrument, lang)
  if (!category) return null
  const { data } = await api.get('/admin/group_results', {
    params: { studyGroup: groupId, category: category.id },
  })
  return (data as ApiResultRow[]) ?? []
}

interface ApiPassport {
  studentId?: number
  student?: { fullName?: string | null; hemisId?: string | null; studyGroup?: { id?: number; name?: string } | null }
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

const PASSPORT_PAGE = 1000

/** API bir so'rovda ko'pi bilan 2000 ta beradi — fakultetda bundan ko'p bo'lishi mumkin, sahifalab olamiz. */
async function fetchAllPassports(params: Record<string, string>): Promise<ApiPassport[]> {
  const all: ApiPassport[] = []

  for (let page = 1; ; page++) {
    const { data } = await api.get('/student_passports', { params: { ...params, itemsPerPage: PASSPORT_PAGE, page } })
    const batch = members<ApiPassport>(data)
    all.push(...batch)
    if (batch.length < PASSPORT_PAGE) return all
  }
}

export interface GroupPassport {
  passport: PassportData
  personalCode: string | null
}

/** Guruhning to'ldirilgan anketalari, talaba id bo'yicha. */
export async function fetchGroupPassports(groupId: string): Promise<Map<number, GroupPassport>> {
  const list = await fetchAllPassports({ 'student.studyGroup': groupId })

  return new Map(
    list
      .filter((p) => p.studentId != null)
      .map((p) => [p.studentId as number, { passport: toPassport(p), personalCode: p.personalCode ?? null }]),
  )
}

export interface FacultyPassport extends GroupPassport {
  fullName: string
  hemisId: string | null
  groupName: string
}

/** Fakultetning barcha to'ldirilgan anketalari (arxiv uchun) — guruh, keyin ism bo'yicha. */
export async function fetchFacultyPassports(facultyId: string): Promise<FacultyPassport[]> {
  const list = await fetchAllPassports({ 'student.studyGroup.faculty': facultyId })

  return list
    .map((p) => ({
      passport: toPassport(p),
      personalCode: p.personalCode ?? null,
      fullName: p.student?.fullName ?? '—',
      hemisId: p.student?.hemisId ?? null,
      groupName: p.student?.studyGroup?.name ?? 'Guruhsiz',
    }))
    .sort((a, b) => a.groupName.localeCompare(b.groupName) || a.fullName.localeCompare(b.fullName))
}

export async function fetchGroupOverview(groupId: string, lang: StudyLanguage): Promise<GroupOverview> {
  const [lists, passports] = await Promise.all([
    Promise.all(OVERVIEW_INSTRUMENTS.map((i) => resultRows(groupId, i, lang).catch(() => null))),
    fetchGroupPassports(groupId).catch(() => new Map<number, GroupPassport>()),
  ])

  const rows = new Map<number, GroupRow>()

  lists.forEach((list, index) => {
    for (const r of list ?? []) {
      const row = rows.get(r.studentId) ?? newRow(r, passports.get(r.studentId))
      if (r.resultKey) row.results[OVERVIEW_INSTRUMENTS[index]] = { resultKey: r.resultKey, label: r.label, score: r.score }
      rows.set(r.studentId, row)
    }
  })

  for (const row of rows.values()) {
    row.temperament = row.results.FREQUENCY_BASED?.resultKey ?? null
    row.figure = row.results.RANKING_BASED?.resultKey ?? null
  }

  return { instruments: OVERVIEW_INSTRUMENTS.filter((_, i) => lists[i] !== null), rows: [...rows.values()] }
}

function newRow(r: ApiResultRow, entry: GroupPassport | undefined): GroupRow {
  return {
    studentId: r.studentId,
    hemisId: r.hemisId,
    fullName: r.fullName,
    results: {},
    temperament: null,
    figure: null,
    passport: entry?.passport ?? null,
    personalCode: entry?.personalCode ?? null,
  }
}
