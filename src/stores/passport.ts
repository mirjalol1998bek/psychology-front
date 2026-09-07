import { defineStore } from 'pinia'

/**
 * "Talabaning ijtimoiy-psixologik pasporti" — the self-report survey each
 * student fills once (editable), matching the columns of the official
 * `Ijtimoiy_psixologik_portret_baza.xlsx` template. Fields the test flow
 * already produces (temperament, character) are merged in on export, not
 * stored here. Kept in localStorage per HEMIS id.
 * TODO(backend): GET/PUT /student/passport, GET /admin/passport/group (TZ §5).
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

const KEY = (studentKey: string) => `psy.passport.${studentKey}`

export const usePassportStore = defineStore('passport', {
  state: () => ({ cache: {} as Record<string, PassportData> }),
  getters: {
    get:
      (s) =>
      (studentKey: string): PassportData | null => {
        if (s.cache[studentKey]) return s.cache[studentKey]
        try {
          const raw = localStorage.getItem(KEY(studentKey))
          if (raw) {
            s.cache[studentKey] = JSON.parse(raw)
            return s.cache[studentKey]
          }
        } catch {
          /* ignore */
        }
        return null
      },
  },
  actions: {
    save(studentKey: string, data: PassportData) {
      const next = { ...data, updatedAt: new Date().toISOString() }
      this.cache[studentKey] = next
      try {
        localStorage.setItem(KEY(studentKey), JSON.stringify(next))
      } catch {
        /* ignore */
      }
    },
  },
})
