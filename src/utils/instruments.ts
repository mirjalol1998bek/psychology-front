import type { InstrumentType } from '@/types/domain'

/**
 * The old app re-implemented temperament/shape color coding and result-mode
 * branching separately in 6+ files (tekshirish, all-results,
 * category-guruh-results, guruh-results, and each temperament/psixogeometrik/
 * nevrasteniya guruh-malumotlari.vue). This is the single source of truth
 * the rebuild uses instead — see <InstrumentResult> for where it's consumed.
 */

export type ResultRenderMode = 'badge' | 'icon-badge' | 'freetext'

export const INSTRUMENT_META: Record<
  InstrumentType,
  { label: string; renderMode: ResultRenderMode; icon: string; routeSegment: string }
> = {
  FREQUENCY_BASED: { label: 'Temperament', renderMode: 'badge', icon: 'mdi-account-heart-outline', routeSegment: 'temperament' },
  RANKING_BASED: { label: 'Psixogeometrik', renderMode: 'icon-badge', icon: 'mdi-shape-outline', routeSegment: 'psixogeometrik' },
  SCORE_RANGE_BASED: { label: 'Nevrasteniya', renderMode: 'freetext', icon: 'mdi-gauge', routeSegment: 'nevrasteniya' },
}

export function instrumentByRoute(segment: string): InstrumentType {
  const found = (Object.entries(INSTRUMENT_META) as [InstrumentType, (typeof INSTRUMENT_META)[InstrumentType]][]).find(
    ([, meta]) => meta.routeSegment === segment,
  )
  return found?.[0] ?? 'FREQUENCY_BASED'
}

// Muted, calm-palette tints — distinguishable but never alarming, and
// readable as both a chip wash and a progress-bar fill in light or dark.
export const TEMPERAMENT_COLORS: Record<string, string> = {
  Xolerik: '#C0563D',
  Sangvinik: '#2F8F5B',
  Flegmatik: '#B58A3C',
  Melanxolik: '#4B7CA6',
}
export const TEMPERAMENT_OPTIONS = Object.keys(TEMPERAMENT_COLORS)

export const SHAPE_COLORS: Record<string, string> = {
  Kvadrat: '#3E6E8E',
  Uchburchak: '#C0563D',
  "To'g'ri to'rtburchak": '#2F8F5B',
  Doira: '#5B8A9B',
  Zigzag: '#B58A3C',
}
export const SHAPE_ICONS: Record<string, string> = {
  Kvadrat: 'mdi-square-outline',
  Uchburchak: 'mdi-triangle-outline',
  "To'g'ri to'rtburchak": 'mdi-rectangle-outline',
  Doira: 'mdi-circle-outline',
  Zigzag: 'mdi-lightning-bolt-outline',
}
export const SHAPE_OPTIONS = Object.keys(SHAPE_COLORS)

export function colorFor(instrument: InstrumentType, value: string | null | undefined): string {
  if (!value) return '#8892A6'
  if (instrument === 'FREQUENCY_BASED') return TEMPERAMENT_COLORS[value] ?? '#8892A6'
  if (instrument === 'RANKING_BASED') return SHAPE_COLORS[value] ?? '#8892A6'
  return '#8892A6'
}
