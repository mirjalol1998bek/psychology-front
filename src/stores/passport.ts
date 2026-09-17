import { defineStore } from 'pinia'
import { api } from '@/services/apiClient'

/**
 * "Ijtimoiy-psixologik anketa" — the self-report survey each student fills
 * once (editable). Backed by the API:
 *   GET /api/student_passport   — current student's passport (or an empty one)
 *   PUT /api/student_passport   — upsert (full replace — always send every field)
 *
 * FISH, fakultet va kurs/guruh HEMIS profilidan olinadi — bu yerda
 * saqlanmaydi (auth.user.hemis orqali komponentda ko'rsatiladi).
 * `personalCode` psixolog beradi — talaba yoza olmaydi, shuning uchun bu
 * yerda umuman yo'q.
 *
 * Test-derived fields (temperament, figure) are merged in on the psychologist's
 * export, not stored here.
 */

export type Gender = 'male' | 'female' | ''
export type LivingArrangement = 'with_family' | 'dormitory' | 'rented' | 'with_relatives' | ''
export type FamilyStatus = 'married' | 'single' | ''
export type FamilyType = 'full' | 'incomplete' | 'under_guardianship' | 'lost_breadwinner' | ''
export type FinancialStatus = 'good' | 'average' | 'difficult' | ''
export type EducationForm = 'budget' | 'contract' | 'grant' | ''
export type WorkStatus = 'no' | 'partial' | 'full_time' | ''

export interface PassportData {
  birthDate: string
  gender: Gender
  permanentAddress: string
  livingArrangement: LivingArrangement
  commuteMinutes: string
  familyStatus: FamilyStatus
  familyType: FamilyType
  siblingsCount: string
  birthOrder: string
  fatherInfo: string
  motherInfo: string
  financialStatus: FinancialStatus
  educationForm: EducationForm
  workStatus: WorkStatus
  priorEducation: string
  gpaScore: string
  languageLevel: string
  extracurricular: string
  leisureActivity: string
  healthLimitations: string
  priorPsychologistVisit: boolean | null
  currentConcern: string
  updatedAt: string
}

export function emptyPassport(): PassportData {
  return {
    birthDate: '',
    gender: '',
    permanentAddress: '',
    livingArrangement: '',
    commuteMinutes: '',
    familyStatus: '',
    familyType: '',
    siblingsCount: '',
    birthOrder: '',
    fatherInfo: '',
    motherInfo: '',
    financialStatus: '',
    educationForm: '',
    workStatus: '',
    priorEducation: '',
    gpaScore: '',
    languageLevel: '',
    extracurricular: '',
    leisureActivity: '',
    healthLimitations: '',
    priorPsychologistVisit: null,
    currentConcern: '',
    updatedAt: '',
  }
}

/** Sog'liq cheklovi anketada aniq ixtiyoriy — to'ldirilganlikka kirmaydi. */
const REQUIRED: (keyof PassportData)[] = [
  'birthDate',
  'gender',
  'permanentAddress',
  'livingArrangement',
  'commuteMinutes',
  'familyStatus',
  'familyType',
  'siblingsCount',
  'birthOrder',
  'fatherInfo',
  'motherInfo',
  'financialStatus',
  'educationForm',
  'workStatus',
  'priorEducation',
  'gpaScore',
  'languageLevel',
  'extracurricular',
  'leisureActivity',
  'priorPsychologistVisit',
  'currentConcern',
]

export function completeness(p: PassportData | null): number {
  if (!p) return 0
  const filled = REQUIRED.filter((k) => {
    const v = p[k]
    return v !== null && String(v).trim().length > 0
  }).length
  return Math.round((filled / REQUIRED.length) * 100)
}

interface BackendPassport {
  birthDate?: string | null
  gender?: Gender | null
  permanentAddress?: string | null
  livingArrangement?: LivingArrangement | null
  commuteMinutes?: number | null
  familyStatus?: FamilyStatus | null
  familyType?: FamilyType | null
  siblingsCount?: number | null
  birthOrder?: number | null
  fatherInfo?: string | null
  motherInfo?: string | null
  financialStatus?: FinancialStatus | null
  educationForm?: EducationForm | null
  workStatus?: WorkStatus | null
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

function fromBackend(b: BackendPassport): PassportData {
  return {
    birthDate: (b.birthDate ?? '').slice(0, 10), // ISO datetime → YYYY-MM-DD
    gender: b.gender ?? '',
    permanentAddress: b.permanentAddress ?? '',
    livingArrangement: b.livingArrangement ?? '',
    commuteMinutes: b.commuteMinutes != null ? String(b.commuteMinutes) : '',
    familyStatus: b.familyStatus ?? '',
    familyType: b.familyType ?? '',
    siblingsCount: b.siblingsCount != null ? String(b.siblingsCount) : '',
    birthOrder: b.birthOrder != null ? String(b.birthOrder) : '',
    fatherInfo: b.fatherInfo ?? '',
    motherInfo: b.motherInfo ?? '',
    financialStatus: b.financialStatus ?? '',
    educationForm: b.educationForm ?? '',
    workStatus: b.workStatus ?? '',
    priorEducation: b.priorEducation ?? '',
    gpaScore: b.gpaScore ?? '',
    languageLevel: b.languageLevel ?? '',
    extracurricular: b.extracurricular ?? '',
    leisureActivity: b.leisureActivity ?? '',
    healthLimitations: b.healthLimitations ?? '',
    priorPsychologistVisit: b.priorPsychologistVisit ?? null,
    currentConcern: b.currentConcern ?? '',
    updatedAt: b.updatedAt ?? '',
  }
}

function toInt(s: string): number | null {
  const n = Number.parseInt(s, 10)
  return Number.isNaN(n) ? null : n
}

function toBackend(p: PassportData): Record<string, unknown> {
  return {
    birthDate: p.birthDate || null,
    gender: p.gender || null,
    permanentAddress: p.permanentAddress || null,
    livingArrangement: p.livingArrangement || null,
    commuteMinutes: toInt(p.commuteMinutes),
    familyStatus: p.familyStatus || null,
    familyType: p.familyType || null,
    siblingsCount: toInt(p.siblingsCount),
    birthOrder: toInt(p.birthOrder),
    fatherInfo: p.fatherInfo || null,
    motherInfo: p.motherInfo || null,
    financialStatus: p.financialStatus || null,
    educationForm: p.educationForm || null,
    workStatus: p.workStatus || null,
    priorEducation: p.priorEducation || null,
    gpaScore: p.gpaScore || null,
    languageLevel: p.languageLevel || null,
    extracurricular: p.extracurricular || null,
    leisureActivity: p.leisureActivity || null,
    healthLimitations: p.healthLimitations || null,
    priorPsychologistVisit: p.priorPsychologistVisit,
    currentConcern: p.currentConcern || null,
  }
}

export const usePassportStore = defineStore('passport', {
  state: () => ({ data: null as PassportData | null, loaded: false, loading: false }),
  getters: {
    // key kept for call-site compatibility; the API scopes to the current
    // user — relies on the store being reset on every identity change, see
    // `resetUserScopedStores` in auth.ts.
    get: (s) => (_studentKey: string): PassportData | null => s.data,
  },
  actions: {
    async load(force = false) {
      if (this.loaded && !force) return
      this.loading = true
      try {
        this.data = fromBackend((await api.get('/student_passport')).data as BackendPassport)
        this.loaded = true
      } catch {
        this.data = emptyPassport()
        this.loaded = true
      } finally {
        this.loading = false
      }
    },
    async save(_studentKey: string, data: PassportData) {
      const saved = (await api.put('/student_passport', toBackend(data))).data as BackendPassport
      this.data = fromBackend(saved)
    },
  },
})
