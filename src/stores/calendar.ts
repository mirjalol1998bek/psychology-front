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
  },
})
