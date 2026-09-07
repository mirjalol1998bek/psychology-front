import { computed, type Ref } from 'vue'
import type { DayCell } from './useMonthGrid'
import type { CalEvent } from '@/mocks/calendar'

export interface EventBar {
  event: CalEvent
  startCol: number // 0-6, Monday-start
  span: number // 1-7 days, clipped to the week row
  lane: number // vertical stacking slot within the row
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Lays multi-day events out as continuous bars across a week row — the
 * Vision UI reference's calendar renders a 3-day event as ONE bar spanning
 * three cells, not three separate pills, so this computes the start column
 * + column-span (+ a greedy vertical lane to avoid overlap) per week.
 */
export function useEventBars(weeks: Ref<DayCell<CalEvent>[][]>, events: CalEvent[] | Ref<CalEvent[]>) {
  return computed<EventBar[][]>(() => {
    const evs = Array.isArray(events) ? events : events.value
    return weeks.value.map((week) => {
      const weekStart = week[0].date
      const weekEnd = week[6].date
      const segments: EventBar[] = []

      evs.forEach((ev) => {
        const start = parseDate(ev.date)
        const end = ev.endDate ? parseDate(ev.endDate) : start
        if (end < weekStart || start > weekEnd) return
        const segStart = start < weekStart ? weekStart : start
        const segEnd = end > weekEnd ? weekEnd : end
        const startCol = Math.round((segStart.getTime() - weekStart.getTime()) / 86400000)
        const span = Math.round((segEnd.getTime() - segStart.getTime()) / 86400000) + 1
        segments.push({ event: ev, startCol, span, lane: 0 })
      })

      segments.sort((a, b) => a.startCol - b.startCol || b.span - a.span)
      const laneEnds: number[] = []
      segments.forEach((seg) => {
        let lane = 0
        while (laneEnds[lane] !== undefined && laneEnds[lane] > seg.startCol) lane++
        seg.lane = lane
        laneEnds[lane] = seg.startCol + seg.span
      })

      return segments
    })
  })
}
