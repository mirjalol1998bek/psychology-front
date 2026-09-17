import { ref, computed, type Ref } from 'vue'
import { i18n } from '@/i18n'

export const WEEKDAYS = ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak']
/** @deprecated joriy tilga mos emas — `monthLabel` `months.long` locale kalitidan foydalanadi. */
export const MONTH_NAMES = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
]

function capitalized(word: string): string {
  return word.length ? word.charAt(0).toUpperCase() + word.slice(1) : word
}

export interface DayCell<E> {
  date: Date
  key: string
  inMonth: boolean
  isToday: boolean
  events: E[]
}

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/**
 * Shared month-grid math for the full Qabul kalendari page and the compact
 * dashboard widget — one date implementation, two renderings.
 */
export function useMonthGrid<E extends { date: string; endDate?: string }>(events: E[], today: Date) {
  const cursor: Ref<Date> = ref(new Date(today.getFullYear(), today.getMonth(), 1))

  const monthLabel = computed(() => {
    const months = i18n.global.tm('months.long') as unknown as string[]
    const name = capitalized(months[cursor.value.getMonth()] ?? '')
    return `${name} ${cursor.value.getFullYear()}`
  })

  const weeks = computed<DayCell<E>[][]>(() => {
    const year = cursor.value.getFullYear()
    const month = cursor.value.getMonth()
    const firstOfMonth = new Date(year, month, 1)
    const offset = (firstOfMonth.getDay() + 6) % 7 // Monday-start
    const gridStart = new Date(year, month, 1 - offset)

    const cells: DayCell<E>[] = Array.from({ length: 42 }, (_, i) => {
      const date = new Date(gridStart)
      date.setDate(gridStart.getDate() + i)
      const key = toKey(date)
      return {
        date,
        key,
        inMonth: date.getMonth() === month,
        isToday: isSameDay(date, today),
        events: events.filter((e) => key >= e.date && key <= (e.endDate ?? e.date)),
      }
    })

    const result: DayCell<E>[][] = []
    for (let i = 0; i < 6; i++) result.push(cells.slice(i * 7, i * 7 + 7))
    return result
  })

  function prevMonth() {
    cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() - 1, 1)
  }
  function nextMonth() {
    cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + 1, 1)
  }
  function goToday() {
    cursor.value = new Date(today.getFullYear(), today.getMonth(), 1)
  }

  return { cursor, monthLabel, weeks, prevMonth, nextMonth, goToday }
}
