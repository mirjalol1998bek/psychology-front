import { defineStore } from 'pinia'
import { api } from '@/services/apiClient'

/**
 * "Talabaning ijtimoiy-psixologik pasporti" — the self-report survey each
 * student fills once (editable). Backed by the API:
 *   GET /api/student_passport   — current student's passport (or an empty one)
 *   PUT /api/student_passport   — upsert
 *
 * Test-derived fields (temperament, figure) are merged in on the psychologist's
 * export, not stored here.
 */

export type FamilyStatus = 'married' | 'single' | ''
export type LivingEnvironment = 'calm' | 'problematic' | ''

export interface PassportData {
  birthDate: string
  currentAddress: string
  phone: string
  familyStatus: FamilyStatus
  livingEnvironment: LivingEnvironment
  talents: string
  parentsInfo: string
  tutorInfo: string
  updatedAt: string
}

export function emptyPassport(): PassportData {
  return {
    birthDate: '',
    currentAddress: '',
    phone: '',
    familyStatus: '',
    livingEnvironment: '',
    talents: '',
    parentsInfo: '',
    tutorInfo: '',
    updatedAt: '',
  }
}

/** Fields that count toward the "profil to'liqligi" percentage. */
const REQUIRED: (keyof PassportData)[] = [
  'birthDate',
  'currentAddress',
  'phone',
  'familyStatus',
  'livingEnvironment',
  'parentsInfo',
  'tutorInfo',
]

export function completeness(p: PassportData | null): number {
  if (!p) return 0
  const filled = REQUIRED.filter((k) => String(p[k]).trim().length > 0).length
  return Math.round((filled / REQUIRED.length) * 100)
}

interface BackendPassport {
  birthDate?: string | null
  currentAddress?: string | null
  phone?: string | null
  familyStatus?: FamilyStatus | null
  livingEnvironment?: LivingEnvironment | null
  talents?: string | null
  parentsInfo?: string | null
  tutorInfo?: string | null
  updatedAt?: string | null
}

function fromBackend(b: BackendPassport): PassportData {
  return {
    birthDate: (b.birthDate ?? '').slice(0, 10), // ISO datetime → YYYY-MM-DD
    currentAddress: b.currentAddress ?? '',
    phone: b.phone ?? '',
    familyStatus: b.familyStatus ?? '',
    livingEnvironment: b.livingEnvironment ?? '',
    talents: b.talents ?? '',
    parentsInfo: b.parentsInfo ?? '',
    tutorInfo: b.tutorInfo ?? '',
    updatedAt: b.updatedAt ?? '',
  }
}

function toBackend(p: PassportData): Record<string, unknown> {
  return {
    birthDate: p.birthDate || null,
    currentAddress: p.currentAddress || null,
    phone: p.phone || null,
    familyStatus: p.familyStatus || null,
    livingEnvironment: p.livingEnvironment || null,
    talents: p.talents || null,
    parentsInfo: p.parentsInfo || null,
    tutorInfo: p.tutorInfo || null,
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
