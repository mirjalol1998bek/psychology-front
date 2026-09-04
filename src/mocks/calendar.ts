import type { AppointmentSlotStatus } from '@/types/domain'

export interface CalEvent {
  date: string // YYYY-MM-DD
  title: string
  time: string
  status: AppointmentSlotStatus
}

// Placeholder — wired to the psychologist's real slot list later (TZ §9).
export const CAL_EVENTS: CalEvent[] = [
  { date: '2026-09-01', title: 'Kirish so‘rovnomasi', time: 'Kun bo‘yi', status: 'booked' },
  { date: '2026-09-04', title: 'A. Karimov', time: '09:30', status: 'booked' },
  { date: '2026-09-04', title: 'Bo‘sh slot', time: '11:00', status: 'free' },
  { date: '2026-09-07', title: 'Guruh treningi', time: '14:00', status: 'booked' },
  { date: '2026-09-09', title: 'Siz', time: '10:00', status: 'booked' },
  { date: '2026-09-09', title: 'Bo‘sh slot', time: '10:30', status: 'free' },
  { date: '2026-09-14', title: 'M. Yusupova', time: '15:00', status: 'booked' },
  { date: '2026-09-18', title: 'Bekor qilingan', time: '13:00', status: 'cancelled' },
  { date: '2026-09-22', title: 'Fakultet monitoring', time: 'Kun bo‘yi', status: 'booked' },
]

export const CAL_STATUS_META: Record<AppointmentSlotStatus, { color: string; icon: string }> = {
  free: { color: '#01B574', icon: 'mdi-calendar-plus-outline' },
  booked: { color: '#0075FF', icon: 'mdi-account-check-outline' },
  cancelled: { color: '#E31A1A', icon: 'mdi-calendar-remove-outline' },
}

export const TODAY = new Date(2026, 8, 4) // TODO(backend): replace with real `new Date()` once slots are live
