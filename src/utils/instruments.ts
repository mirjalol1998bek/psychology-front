import type { InstrumentType } from '@/types/domain'
import { i18n } from '@/i18n'

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
  { label: string; renderMode: ResultRenderMode; icon: string; routeSegment: string; tint: string }
> = {
  FREQUENCY_BASED: {
    label: 'Temperament',
    renderMode: 'badge',
    icon: 'mdi-account-heart-outline',
    routeSegment: 'temperament',
    tint: '#1E9E6B',
  },
  RANKING_BASED: {
    label: 'Psixogeometrik',
    renderMode: 'icon-badge',
    icon: 'mdi-shape-outline',
    routeSegment: 'psixogeometrik',
    tint: '#0FA189',
  },
  SUBSCALE_BASED: {
    label: 'IPM-20',
    renderMode: 'freetext',
    icon: 'mdi-compass-outline',
    routeSegment: 'moslashuv',
    tint: 'rgb(var(--v-theme-warning))',
  },
  MOTIVATION_BASED: {
    label: 'OKM-20',
    renderMode: 'freetext',
    icon: 'mdi-target',
    routeSegment: 'motivatsiya',
    tint: 'rgb(var(--v-theme-info))',
  },
  RESILIENCE_BASED: {
    label: 'EHS-20',
    renderMode: 'freetext',
    icon: 'mdi-heart-pulse',
    routeSegment: 'emotsional',
    tint: 'rgb(var(--v-theme-success))',
  },
  COMMUNICATION_BASED: {
    label: 'KSM-20',
    renderMode: 'freetext',
    icon: 'mdi-account-voice',
    routeSegment: 'kommunikativ',
    tint: 'rgb(var(--v-theme-secondary))',
  },
  RISK_BASED: {
    label: 'XO-20',
    renderMode: 'freetext',
    icon: 'mdi-shield-alert-outline',
    routeSegment: 'xatar',
    tint: '#7C6FDB',
  },
}

/** Metodika nomi joriy interfeys tiliga qarab (`instrument.*` locale kaliti). */
export function instrumentLabel(type: InstrumentType): string {
  return i18n.global.t(`instrument.${type}`)
}

export function instrumentByRoute(segment: string): InstrumentType {
  const found = (Object.entries(INSTRUMENT_META) as [InstrumentType, (typeof INSTRUMENT_META)[InstrumentType]][]).find(
    ([, meta]) => meta.routeSegment === segment,
  )
  return found?.[0] ?? 'FREQUENCY_BASED'
}

// Vivid but considered tints — distinguishable and alive, never alarming,
// readable as both a chip wash and a progress-bar fill in light or dark.
export const TEMPERAMENT_COLORS: Record<string, string> = {
  Xolerik: '#D9552F',
  Sangvinik: '#1E9E6B',
  Flegmatik: '#D9A233',
  Melanxolik: '#3D85C6',
}
export const TEMPERAMENT_OPTIONS = Object.keys(TEMPERAMENT_COLORS)

export const SHAPE_COLORS: Record<string, string> = {
  Kvadrat: '#3D85C6',
  Uchburchak: '#D9552F',
  "To'g'ri to'rtburchak": '#1E9E6B',
  Doira: '#0FA189',
  Zigzag: '#D9A233',
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
