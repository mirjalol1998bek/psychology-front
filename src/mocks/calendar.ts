import type { AppointmentSlotStatus } from '@/types/domain'

export interface CalEvent {
  id: string
  date: string // YYYY-MM-DD (start)
  endDate?: string // YYYY-MM-DD (inclusive end, for multi-day events)
  title: string
  time: string
  status: AppointmentSlotStatus
}

// Placeholder — wired to the psychologist's real slot list later (TZ §9).
export const CAL_EVENTS: CalEvent[] = [
  { id: 'e1', date: '2026-09-01', title: 'Kirish so‘rovnomasi', time: 'Kun bo‘yi', status: 'booked' },
  { id: 'e2', date: '2026-09-02', endDate: '2026-09-04', title: 'Fakultet monitoring', time: 'Kun bo‘yi', status: 'booked' },
  { id: 'e3', date: '2026-09-04', title: 'A. Karimov', time: '09:30', status: 'booked' },
  { id: 'e4', date: '2026-09-04', title: 'Bo‘sh slot', time: '11:00', status: 'free' },
  { id: 'e5', date: '2026-09-07', endDate: '2026-09-08', title: 'Guruh treningi', time: '14:00', status: 'booked' },
  { id: 'e6', date: '2026-09-09', title: 'Siz', time: '10:00', status: 'booked' },
  { id: 'e7', date: '2026-09-09', title: 'Bo‘sh slot', time: '10:30', status: 'free' },
  { id: 'e8', date: '2026-09-14', title: 'M. Yusupova', time: '15:00', status: 'booked' },
  { id: 'e9', date: '2026-09-18', title: 'Bekor qilingan', time: '13:00', status: 'cancelled' },
  { id: 'e10', date: '2026-09-21', endDate: '2026-09-25', title: 'Semestr monitoring', time: 'Kun bo‘yi', status: 'booked' },
]

export const CAL_STATUS_META: Record<AppointmentSlotStatus, { color: string; icon: string }> = {
  free: { color: '#2F8F5B', icon: 'mdi-calendar-plus-outline' },
  booked: { color: '#0E7C6B', icon: 'mdi-account-check-outline' },
  cancelled: { color: '#B4472E', icon: 'mdi-calendar-remove-outline' },
}

export const TODAY = new Date(2026, 8, 4) // TODO(backend): replace with real `new Date()` once slots are live
