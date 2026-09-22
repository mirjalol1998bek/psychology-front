import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import { createVuetify, type ThemeDefinition } from 'vuetify'

/**
 * "Warm bloom" palette — a university psychology service, not a trading
 * dashboard, but not a muffled grey one either. Vivid emerald-teal + a warm
 * terracotta/coral secondary (the "human warmth" counterpart to the calming
 * teal), a genuinely warm cream ground instead of a cool grey one, solid
 * cards with soft shadows. Light is the primary experience; dark is a fully-
 * designed vivid-on-charcoal counterpart (never neon). The instrument
 * colours (temperament / shape) live in src/utils/instruments.ts and are
 * tuned to sit inside this palette.
 */
const lightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    // Cool, near-white fallback (used wherever a flat colour is needed,
    // e.g. Vuetify internals) — the actual page background is a subtle
    // teal-tinted gradient, see --gradient-page in global.css.
    background: '#F7FAF9',
    surface: '#FFFFFF',
    'surface-bright': '#FFFFFF',
    'surface-variant': '#E7F2EE',
    'on-surface-variant': '#3D4B46',
    primary: '#0FA189',
    'primary-darken-1': '#0B7D6A',
    secondary: '#E2703F',
    'secondary-darken-1': '#C2582C',
    error: '#C6402F',
    success: '#1E9E6B',
    warning: '#DB9A2B',
    info: '#3D85C6',
    'on-background': '#211E1A',
    'on-surface': '#211E1A',
    'on-primary': '#FFFFFF',
    'on-secondary': '#FFFFFF',
  },
  variables: {
    'border-color': '#211E1A',
    'border-opacity': 0.09,
    'high-emphasis-opacity': 0.94,
    'medium-emphasis-opacity': 0.62,
    'theme-kbd': '#211E1A',
    'hover-opacity': 0.05,
    'activated-opacity': 0.09,
  },
}

const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    background: '#101815',
    surface: '#182420',
    'surface-bright': '#202E28',
    'surface-variant': '#2B3931',
    'on-surface-variant': '#C7D0C9',
    primary: '#4FD3B8',
    'primary-darken-1': '#34B69B',
    secondary: '#F29A69',
    'secondary-darken-1': '#DA7C46',
    error: '#E8806D',
    success: '#6BD1A0',
    warning: '#E8C077',
    info: '#8CC3F0',
    'on-background': '#EFEDE7',
    'on-surface': '#EFEDE7',
    'on-primary': '#052821',
    'on-secondary': '#2E1206',
  },
  variables: {
    'border-color': '#FFFFFF',
    'border-opacity': 0.1,
    'high-emphasis-opacity': 0.96,
    'medium-emphasis-opacity': 0.68,
    'theme-kbd': '#FFFFFF',
    'hover-opacity': 0.06,
    'activated-opacity': 0.11,
  },
}

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: lightTheme,
      dark: darkTheme,
    },
  },
  defaults: {
    VBtn: {
      rounded: 'lg',
      flat: true,
      class: 'text-none',
    },
    VCard: {
      rounded: 'lg',
      elevation: 0,
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
      color: 'primary',
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
      color: 'primary',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
      color: 'primary',
    },
    VChip: {
      rounded: 'md',
    },
    VList: {
      rounded: 'lg',
    },
    VProgressLinear: {
      rounded: true,
      height: 8,
    },
    VDialog: {
      // calmer entrance
      transition: 'fade-transition',
    },
  },
})
