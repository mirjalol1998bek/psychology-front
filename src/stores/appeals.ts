import { defineStore } from 'pinia'

/**
 * Student → psychologist appeals ("murojaat"). A lightweight one-thread
 * channel: the student writes, the psychologist replies once, the student
 * reads the reply. Stored in localStorage (`psy.appeals`).
 *
 * `mode: 'anonymous'` hides the student's name and faculty/group from the
 * psychologist's inbox — but `studentKey` (HEMIS id) is still kept so the
 * reply can be routed back to that student's own list.
 * TODO(backend): POST /appeals, GET /appeals, POST /appeals/:id/reply (TZ §8.2).
 */

export type AppealMode = 'named' | 'anonymous'
export type AppealTopic = 'question' | 'appointment' | 'stress' | 'other'
export type AppealStatus = 'open' | 'answered'

export interface Appeal {
  id: string
  studentKey: string
  studentName: string
  faculty?: string
  group?: string
  mode: AppealMode
  topic: AppealTopic
  message: string
  wantsAppointment: boolean
  createdAt: string
  reply?: string
  repliedBy?: string
  repliedAt?: string
  status: AppealStatus
}

const STORAGE_KEY = 'psy.appeals'

const SEED: Appeal[] = [
  {
    id: 'seed-1',
    studentKey: '38210001525',
    studentName: 'Aziz Karimov',
    faculty: 'Xorijiy filologiya fakulteti',
    group: '21-FIL-14',
    mode: 'named',
    topic: 'appointment',
    message: 'Assalomu alaykum. Imtihonlar oldidan juda hayajonlanyapman, shaxsiy suhbatga yozilsam bo‘ladimi?',
    wantsAppointment: true,
    createdAt: '2026-09-05T09:12:00.000Z',
    status: 'open',
  },
  {
    id: 'seed-2',
    studentKey: 'anon-x1',
    studentName: '',
    mode: 'anonymous',
    topic: 'stress',
    message: 'So‘nggi paytlarda uyqum buzilgan, hech narsaga qiziqmayapman. Nima qilsam bo‘ladi?',
    wantsAppointment: false,
    createdAt: '2026-09-06T18:40:00.000Z',
    status: 'open',
  },
  {
    id: 'seed-3',
    studentKey: '38210001530',
    studentName: 'Zilola Yusupova',
    faculty: 'Xorijiy filologiya fakulteti',
    group: '21-FIL-14',
    mode: 'named',
    topic: 'question',
    message: 'Temperament testi natijamni qayerdan ko‘rsam bo‘ladi?',
    wantsAppointment: false,
    createdAt: '2026-09-04T11:00:00.000Z',
    reply: 'Salom! Natijangiz “Natijalar” bo‘limida, test kartasidagi “Natijani ko‘rish” tugmasi orqali ochiladi.',
    repliedBy: 'Nilufar Egamova',
    repliedAt: '2026-09-04T14:20:00.000Z',
    status: 'answered',
  },
]

function load(): Appeal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return SEED.map((a) => ({ ...a }))
}

let uid = Date.now() % 100000

export const useAppealsStore = defineStore('appeals', {
  state: () => ({ appeals: load() as Appeal[] }),
  getters: {
    ordered: (s) => [...s.appeals].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    openCount: (s) => s.appeals.filter((a) => a.status === 'open').length,
    forStudent: (s) => (key: string) =>
      [...s.appeals].filter((a) => a.studentKey === key).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  },
  actions: {
    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.appeals))
      } catch {
        /* ignore */
      }
    },
    submit(input: {
      studentKey: string
      studentName: string
      faculty?: string
      group?: string
      mode: AppealMode
      topic: AppealTopic
      message: string
      wantsAppointment: boolean
    }): Appeal {
      const appeal: Appeal = {
        id: `a-${++uid}`,
        ...input,
        studentName: input.mode === 'anonymous' ? '' : input.studentName,
        createdAt: new Date().toISOString(),
        status: 'open',
      }
      this.appeals.push(appeal)
      this.persist()
      return appeal
    },
    reply(id: string, text: string, byName: string) {
      const a = this.appeals.find((x) => x.id === id)
      if (!a) return
      a.reply = text.trim()
      a.repliedBy = byName
      a.repliedAt = new Date().toISOString()
      a.status = 'answered'
      this.persist()
    },
  },
})
