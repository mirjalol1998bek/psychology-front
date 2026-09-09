import { i18n } from '@/i18n'

/**
 * Sanani joriy interfeys tilida formatlash — oy nomlari `months.long` /
 * `months.short` locale kalitidan. Barcha ko'rinishlar shu yerdan foydalanadi,
 * `.vue` fayllarida qo'lda oy massivlari bo'lmasin.
 */
export function formatDay(
  iso: string | undefined | null,
  opts: { short?: boolean; year?: boolean; time?: boolean } = {},
): string {
  if (!iso) return ''

  const d = new Date(iso)

  if (Number.isNaN(d.getTime())) return ''

  const months = i18n.global.tm(opts.short ? 'months.short' : 'months.long') as unknown as string[]
  const month = months[d.getMonth()] ?? ''
  let out = `${d.getDate()}-${month}`

  if (opts.year) out += ` ${d.getFullYear()}`

  if (opts.time) {
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    out += `, ${hh}:${mm}`
  }

  return out
}
