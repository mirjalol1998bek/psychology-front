import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import { createVuetify, type ThemeDefinition } from 'vuetify'

// Palette carried over from the project's TZ document for brand continuity:
// a calm, academic teal/sage as the primary (psychology, trust) with a warm
// clay accent for secondary actions — deliberately not the default Material
// indigo/purple.
const lightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#F6F3EC',
    surface: '#FFFFFF',
    'surface-variant': '#EFEAE0',
    primary: '#2E5C55',
    'primary-darken-1': '#1F433D',
    secondary: '#AD5F39',
    'secondary-darken-1': '#8A4A2C',
    error: '#AE3A3A',
    success: '#3F7D52',
    warning: '#A9781F',
    info: '#3E6FA6',
    'on-background': '#211E1A',
    'on-surface': '#211E1A',
  },
  variables: {
    'border-color': '#211E1A',
    'border-opacity': 0.08,
  },
}

const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    background: '#17181A',
    surface: '#1F2123',
    'surface-variant': '#2A2C2F',
    primary: '#79B5AA',
    'primary-darken-1': '#5C9389',
    secondary: '#E0916A',
    'secondary-darken-1': '#C77850',
    error: '#E28D8D',
    success: '#7FC393',
    warning: '#E3BE6E',
    info: '#8FB6E0',
    'on-background': '#ECE7DC',
    'on-surface': '#ECE7DC',
  },
  variables: {
    'border-color': '#ECE7DC',
    'border-opacity': 0.1,
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
      fontWeight: 600,
      rounded: 'lg',
    },
    VCard: {
      rounded: 'lg',
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
  },
})
