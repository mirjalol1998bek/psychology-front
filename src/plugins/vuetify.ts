import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import { createVuetify, type ThemeDefinition } from 'vuetify'

/**
 * "Calm care" palette — a university psychology service, not a trading
 * dashboard. Warm off-white ground, a considered deep-teal primary, muted
 * supporting colours, solid cards with soft shadows. Light is the primary
 * experience; dark is a fully-designed calm counterpart (deep desaturated
 * green-black, never neon). The instrument colours (temperament / shape)
 * live in src/utils/instruments.ts and are tuned to sit inside this palette.
 */
const lightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#F4F6F4',
    surface: '#FFFFFF',
    'surface-bright': '#FFFFFF',
    'surface-variant': '#E8EEEB',
    'on-surface-variant': '#3C4A45',
    primary: '#0E7C6B',
    'primary-darken-1': '#0A5F52',
    secondary: '#4B6D8C',
    'secondary-darken-1': '#3A566F',
    error: '#B4472E',
    success: '#2F8F5B',
    warning: '#B07321',
    info: '#3E7CB1',
    'on-background': '#182420',
    'on-surface': '#182420',
    'on-primary': '#FFFFFF',
    'on-secondary': '#FFFFFF',
  },
  variables: {
    'border-color': '#182420',
    'border-opacity': 0.09,
    'high-emphasis-opacity': 0.94,
    'medium-emphasis-opacity': 0.62,
    'theme-kbd': '#182420',
    'hover-opacity': 0.05,
    'activated-opacity': 0.09,
  },
}

const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    background: '#0E1613',
    surface: '#15201C',
    'surface-bright': '#1D2B26',
    'surface-variant': '#26332E',
    'on-surface-variant': '#B7C4BE',
    primary: '#54B7A5',
    'primary-darken-1': '#3E9C8B',
    secondary: '#93B2CC',
    'secondary-darken-1': '#7A9BB8',
    error: '#E08D75',
    success: '#63C08C',
    warning: '#D9AE6B',
    info: '#8FB8DC',
    'on-background': '#E7ECE9',
    'on-surface': '#E7ECE9',
    'on-primary': '#04120F',
    'on-secondary': '#04120F',
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
