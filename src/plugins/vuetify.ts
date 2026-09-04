import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import { createVuetify, type ThemeDefinition } from 'vuetify'

/**
 * Vision UI–inspired palette: deep navy/indigo ground, glass-morphic cards,
 * a blue→cyan gradient accent for primary actions, and saturated icon-badge
 * colors (green/cyan/pink) for status and stat tiles. Dark is the primary,
 * showcase experience; light is a tasteful secondary for accessibility.
 */
const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    background: '#0B1437',
    surface: '#131C42',
    'surface-variant': '#1B2550',
    primary: '#0075FF',
    'primary-darken-1': '#0058C4',
    secondary: '#2CD9FF',
    'secondary-darken-1': '#17B7DA',
    error: '#E31A1A',
    success: '#01B574',
    warning: '#FFB547',
    info: '#2CD9FF',
    'on-background': '#FFFFFF',
    'on-surface': '#FFFFFF',
  },
  variables: {
    'border-color': '#FFFFFF',
    'border-opacity': 0.09,
    'high-emphasis-opacity': 1,
    'medium-emphasis-opacity': 0.64,
  },
}

const lightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#F3F5FB',
    surface: '#FFFFFF',
    'surface-variant': '#EAEEFA',
    primary: '#0075FF',
    'primary-darken-1': '#0058C4',
    secondary: '#0FA9D6',
    'secondary-darken-1': '#0C86AB',
    error: '#E31A1A',
    success: '#01B574',
    warning: '#B4790C',
    info: '#0FA9D6',
    'on-background': '#1B2143',
    'on-surface': '#1B2143',
  },
  variables: {
    'border-color': '#1B2143',
    'border-opacity': 0.08,
  },
}

export default createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: darkTheme,
      light: lightTheme,
    },
  },
  defaults: {
    VBtn: {
      fontWeight: 600,
      rounded: 'lg',
    },
    VCard: {
      rounded: 'xl',
      elevation: 0,
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
    },
    VChip: {
      rounded: 'lg',
    },
    VProgressLinear: {
      rounded: true,
      height: 8,
    },
  },
})
