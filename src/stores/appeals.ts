import { defineStore } from 'pinia'
import { api } from '@/services/apiClient'
import { members } from '@/services/quizService'

/**
 * Student → psychologist appeals ("murojaat"), backed by the API.
 *   GET  /api/appeals              — student: own; staff: all
 *   POST /api/appeals              — {mode, topic, message, wantsAppointment, preferredDate?, preferredTime?}
 *   POST /api/appeals/{id}/reply   — {reply}   (ROLE_PSYCHOLOGIST)
 *   POST /api/appeals/{id}/book    — {date, startTime}   (ROLE_PSYCHOLOGIST) — 2 soatlik AppointmentSlot yaratadi
 *
 * `mode: 'anonymous'` — the backend still stores the student link (to route the
 * reply) but never exposes the name/group; `senderName`/`senderGroup` come back
 * null.
 */

export type AppealMode = 'named' | 'anonymous'
export type AppealTopic = 'question' | 'appointment' | 'stress' | 'other'
export type AppealStatus = 'open' | 'answered'

export interface Appeal {
  id: string
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
  /** Talaba so'ragan vaqt (hali belgilanmagan bo'lsa). */
  preferredDate?: string
  preferredTime?: string
  /** Psixolog "Qabul qilish" bilan tasdiqlagan haqiqiy vaqt (2 soatlik). */
  appointmentDate?: string
  appointmentStartTime?: string
  appointmentEndTime?: string
}

interface BackendAppeal {
  id: number
  mode: AppealMode
  topic: AppealTopic
  message: string
  wantsAppointment: boolean
  status: AppealStatus
  reply?: string | null
  repliedAt?: string | null
  createdAt: string
  senderName?: string | null
  senderGroup?: string | null
  repliedByName?: string | null
  preferredDate?: string | null
  preferredTime?: string | null
  appointmentDate?: string | null
  appointmentStartTime?: string | null
  appointmentEndTime?: string | null
}

function mapAppeal(b: BackendAppeal): Appeal {
  return {
    id: String(b.id),
    studentName: b.senderName ?? '',
    group: b.senderGroup ?? undefined,
    mode: b.mode,
    topic: b.topic,
    message: b.message,
    wantsAppointment: !!b.wantsAppointment,
    createdAt: b.createdAt,
    reply: b.reply ?? undefined,
    repliedBy: b.repliedByName ?? (b.reply ? 'Psixolog' : undefined),
    repliedAt: b.repliedAt ?? undefined,
    status: b.status,
    preferredDate: b.preferredDate ? b.preferredDate.slice(0, 10) : undefined,
    preferredTime: b.preferredTime ?? undefined,
    appointmentDate: b.appointmentDate ?? undefined,
    appointmentStartTime: b.appointmentStartTime ?? undefined,
    appointmentEndTime: b.appointmentEndTime ?? undefined,
  }
}

export interface AppealInput {
  mode: AppealMode
  topic: AppealTopic
  message: string
  wantsAppointment: boolean
  preferredDate?: string
  preferredTime?: string
}

export const useAppealsStore = defineStore('appeals', {
  state: () => ({ appeals: [] as Appeal[], loaded: false, loading: false }),
  getters: {
    ordered: (s) => [...s.appeals].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    openCount: (s) => s.appeals.filter((a) => a.status === 'open').length,
    // The API scopes the collection to the current student (Appeal carries no
    // student id to re-filter by client-side) — relies on the store being
    // reset on every identity change; see `resetUserScopedStores` in auth.ts.
    forStudent: (s) => (_key: string) =>
      [...s.appeals].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  },
  actions: {
    async load(force = false) {
      if (this.loaded && !force) return
      this.loading = true
      try {
        this.appeals = members<BackendAppeal>((await api.get('/appeals')).data).map(mapAppeal)
        this.loaded = true
      } finally {
        this.loading = false
      }
    },
    async submit(input: AppealInput): Promise<Appeal> {
      const created = (await api.post('/appeals', input)).data as BackendAppeal
      const appeal = mapAppeal(created)
      this.appeals.push(appeal)
      return appeal
    },
    async reply(id: string, text: string) {
      const updated = (await api.post(`/appeals/${id}/reply`, { reply: text.trim() })).data as BackendAppeal
      const idx = this.appeals.findIndex((x) => x.id === id)
      if (idx >= 0) this.appeals[idx] = mapAppeal(updated)
      else this.appeals.push(mapAppeal(updated))
    },
    /** Qabulni tasdiqlaydi — 2 soatlik AppointmentSlot yaratadi (409 = vaqt band). */
    async bookAppointment(id: string, date: string, startTime: string) {
      await api.post(`/appeals/${id}/book`, { date, startTime })
      await this.load(true)
    },
  },
})
