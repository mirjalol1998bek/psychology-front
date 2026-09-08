import type { AppointmentSlotStatus } from '@/types/domain'

export interface CalEvent {
  id: string
  date: string // YYYY-MM-DD (start)
  endDate?: string // YYYY-MM-DD (inclusive end, for multi-day events)
  title: string
  time: string
  status: AppointmentSlotStatus
}

/** Real slots come from useCalendarStore (GET /api/appointment_slots). */
export const CAL_EVENTS: CalEvent[] = []

export const CAL_STATUS_META: Record<AppointmentSlotStatus, { color: string; icon: string }> = {
  free: { color: '#2F8F5B', icon: 'mdi-calendar-plus-outline' },
  booked: { color: '#0E7C6B', icon: 'mdi-account-check-outline' },
  cancelled: { color: '#B4472E', icon: 'mdi-calendar-remove-outline' },
}

export const TODAY = new Date()
