import { defineStore } from 'pinia'
import type { CalEvent } from '@/mocks/calendar'
import type { AppointmentSlotStatus } from '@/types/domain'
import { api } from '@/services/apiClient'
import { members } from '@/services/quizService'

/**
 * Psychologist appointment calendar, backed by the API:
 *   GET    /api/appointment_slots
 *   POST   /api/appointment_slots            (psychologist auto-set)
 *   PATCH  /api/appointment_slots/{id}
 *   DELETE /api/appointment_slots/{id}
 *
 * `events` is mutated in place (never reassigned) because useMonthGrid /
 * useEventBars capture the array reference.
 */

interface BackendSlot {
  id: number
  date: string
  startTime: string
  endTime?: string | null
  status: AppointmentSlotStatus
  title?: string | null
  room?: string | null
  student?: { fullName?: string } | null
}

export interface SlotInput {
  title: string
  date: string
  time: string
  status: AppointmentSlotStatus
  room?: string
}

function toEvent(s: BackendSlot): CalEvent {
  return {
    id: String(s.id),
    date: (s.date ?? '').slice(0, 10),
    title: s.title || s.student?.fullName || (s.status === 'free' ? 'Bo‘sh slot' : 'Qabul'),
    time: s.startTime || 'Kun bo‘yi',
    status: s.status,
  }
}

function toBody(input: SlotInput): Record<string, unknown> {
  return {
    title: input.title || null,
    date: input.date,
    startTime: input.time && input.time !== 'Kun bo‘yi' ? input.time : '09:00',
    status: input.status,
    room: input.room || null,
  }
}

export const useCalendarStore = defineStore('calendar', {
  state: () => ({ events: [] as CalEvent[], loaded: false, loading: false }),
  actions: {
    async load(force = false) {
      if (this.loaded && !force) return
      this.loading = true
      try {
        const slots = members<BackendSlot>((await api.get('/appointment_slots')).data).map(toEvent)
        this.events.splice(0, this.events.length, ...slots)
        this.loaded = true
      } finally {
        this.loading = false
      }
    },
    async addEvent(input: SlotInput) {
      const created = (await api.post('/appointment_slots', toBody(input))).data as BackendSlot
      this.events.push(toEvent(created))
    },
    async updateEvent(id: string, input: SlotInput) {
      const updated = (await api.patch(`/appointment_slots/${id}`, toBody(input), {
        headers: { 'Content-Type': 'application/merge-patch+json' },
      })).data as BackendSlot
      const idx = this.events.findIndex((e) => e.id === id)
      if (idx !== -1) this.events.splice(idx, 1, toEvent(updated))
    },
    async removeEvent(id: string) {
      await api.delete(`/appointment_slots/${id}`)
      const idx = this.events.findIndex((e) => e.id === id)
      if (idx !== -1) this.events.splice(idx, 1)
    },
  },
})
