import type { PassportData } from '@/stores/passport'
import { formatDay } from '@/utils/datetime'

/**
 * "Ijtimoiy-psixologik anketa" qiymatlari va bo'limlari — xodim ko'rinishi,
 * PDF va Excel eksporti bir xil nomlarni ishlatsin (talaba formasi o'z i18n
 * matnlaridan foydalanadi).
 */

export const GENDER: Record<string, string> = { male: 'Erkak', female: 'Ayol' }
export const LIVING: Record<string, string> = {
  with_family: 'Oila bilan',
  dormitory: 'Talabalar turar joyida',
  rented: 'Ijarada',
  with_relatives: 'Qarindoshlarnikida',
}
export const FAMILY: Record<string, string> = { married: 'Turmush qurgan', single: 'Turmush qurmagan' }
export const FAMILY_TYPE: Record<string, string> = {
  full: 'To‘liq',
  incomplete: 'To‘liqsiz',
  under_guardianship: 'Vasiylikda',
  lost_breadwinner: 'Boquvchisini yo‘qotgan',
}
export const FINANCIAL: Record<string, string> = { good: 'Yaxshi', average: 'O‘rtacha', difficult: 'Qiyin' }
export const EDUCATION_FORM: Record<string, string> = { budget: 'Byudjet', contract: 'To‘lov-kontrakt', grant: 'Grant' }
export const WORK_STATUS: Record<string, string> = { no: 'Yo‘q', partial: 'Qisman', full_time: 'Doimiy' }

export function ageFrom(birthDate: string): string {
  if (!birthDate) return ''
  const b = new Date(birthDate)
  if (Number.isNaN(b.getTime())) return ''
  const now = new Date()
  let years = now.getFullYear() - b.getFullYear()
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) years--
  return years >= 0 ? String(years) : ''
}

export function yesNo(v: boolean | null): string {
  return v === true ? 'Ha' : v === false ? 'Yo‘q' : ''
}

function pick(dict: Record<string, string>, key: string): string {
  return key ? (dict[key] ?? key) : ''
}

export interface PassportSection {
  title: string
  rows: [label: string, value: string][]
}

export function passportSections(p: PassportData): PassportSection[] {
  const age = ageFrom(p.birthDate)

  return [
    {
      title: 'Shaxsiy ma’lumotlar',
      rows: [
        ['Tug‘ilgan sana', p.birthDate ? `${formatDay(p.birthDate, { year: true })}${age ? ` (${age} yosh)` : ''}` : ''],
        ['Jinsi', pick(GENDER, p.gender)],
        ['Doimiy yashash manzili', p.permanentAddress],
        ['Hozir qayerda yashaydi', pick(LIVING, p.livingArrangement)],
        ['Yo‘lda ketadigan vaqt', p.commuteMinutes ? `${p.commuteMinutes} daqiqa` : ''],
      ],
    },
    {
      title: 'Oila',
      rows: [
        ['Oilaviy holati', pick(FAMILY, p.familyStatus)],
        ['Oila tipi', pick(FAMILY_TYPE, p.familyType)],
        ['Farzandlar soni', p.siblingsCount],
        ['Nechanchi farzand', p.birthOrder],
        ['Otasining ma’lumoti va kasbi', p.fatherInfo],
        ['Onasining ma’lumoti va kasbi', p.motherInfo],
        ['Moddiy ahvoli', pick(FINANCIAL, p.financialStatus)],
      ],
    },
    {
      title: 'Ta’lim va bandlik',
      rows: [
        ['Ta’lim shakli', pick(EDUCATION_FORM, p.educationForm)],
        ['Ishlaydimi', pick(WORK_STATUS, p.workStatus)],
        ['Universitetgacha tugatgan muassasa', p.priorEducation],
        ['O‘rtacha bahosi', p.gpaScore],
        ['Chet tili darajasi', p.languageLevel],
      ],
    },
    {
      title: 'Qiziqishlar va psixologik holat',
      rows: [
        ['To‘garak / faoliyat', p.extracurricular],
        ['Bo‘sh vaqt', p.leisureActivity],
        ['Sog‘liq cheklovlari', p.healthLimitations],
        ['Ilgari psixologga murojaat qilganmi', yesNo(p.priorPsychologistVisit)],
        ['Hozirgi tashvishi', p.currentConcern],
      ],
    },
  ]
}
