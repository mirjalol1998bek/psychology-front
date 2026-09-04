import { createI18n } from 'vue-i18n'
import uz from '@/locales/uz'
import ru from '@/locales/ru'

const STORAGE_KEY = 'psy.locale'

function initialLocale(): 'uz' | 'ru' {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'ru' ? 'ru' : 'uz'
}

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'uz',
  messages: { uz, ru },
})

export function setLocale(locale: 'uz' | 'ru') {
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
}
