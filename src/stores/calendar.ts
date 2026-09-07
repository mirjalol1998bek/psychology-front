import { defineStore } from 'pinia'
import { CAL_EVENTS, type CalEvent } from '@/mocks/calendar'

let uid = 0

/**
 * Shared, reactive event list — the psychologist's "Voqea qo'shish" adds
 * here, and both the full /calendar page and the dashboard's mini widgets
 * read from the same store, so a new event shows up everywhere immediately.
 * TODO(backend): replace with GET/POST against the real appointment-slot
 * API once it exists (TZ §9).
 */
export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    events: [...CAL_EVENTS] as CalEvent[],
  }),
  actions: {
    addEvent(event: Omit<CalEvent, 'id'> & { id?: string }) {
      this.events.push({ ...event, id: event.id ?? `local-${++uid}` } as CalEvent)
    },
    updateEvent(id: string, patch: Partial<Omit<CalEvent, 'id'>>) {
      const idx = this.events.findIndex((e) => e.id === id)
      if (idx !== -1) this.events[idx] = { ...this.events[idx], ...patch }
    },
    removeEvent(id: string) {
      // Mutate in place — some consumers (useMonthGrid) captured the array
      // reference, so reassigning this.events would leave them stale.
      const idx = this.events.findIndex((e) => e.id === id)
      if (idx !== -1) this.events.splice(idx, 1)
    },
  },
})
