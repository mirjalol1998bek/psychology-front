import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

export interface NavItem {
  title: string
  icon: string
  to: string
  /** Qidiruvda topilishi uchun qo'shimcha so'zlar (uz + ru). */
  keywords?: string
}

/**
 * Yon menyu va global qidiruv bitta ro'yxatdan foydalanadi — rolga qarab
 * filtrlanadi. `mainNav` + `staffNav` — DefaultLayout uchun; `allNav` — qidiruv
 * va sarlavha aniqlash uchun tekis, takrorsiz ro'yxat.
 */
export function useNavItems() {
  const { t } = useI18n()
  const auth = useAuthStore()

  const mainNav = computed<NavItem[]>(() => {
    const items: NavItem[] = [
      { title: t('nav.dashboard'), icon: 'mdi-view-dashboard-outline', to: '/', keywords: 'bosh asosiy главная' },
      { title: t('nav.tests'), icon: 'mdi-clipboard-text-outline', to: '/tests', keywords: 'metodika sinov so\'rovnoma тест' },
      { title: t('nav.results'), icon: 'mdi-chart-box-outline', to: '/results', keywords: 'natija ball результат' },
    ]

    if (!auth.isStaff) {
      items.push({ title: t('nav.passport'), icon: 'mdi-card-account-details-outline', to: '/passport', keywords: 'pasport паспорт' })
      items.push({ title: t('nav.appeals'), icon: 'mdi-message-text-outline', to: '/appeals', keywords: 'murojaat savol обращение' })
      items.push({ title: t('nav.calendar'), icon: 'mdi-calendar-heart', to: '/calendar', keywords: 'qabul bo\'sh band kalendar приём календарь' })
    }

    return items
  })

  const staffNav = computed<NavItem[]>(() => {
    if (!auth.isStaff) {
      return []
    }

    const items: NavItem[] = [
      { title: t('nav.appeals'), icon: 'mdi-message-text-outline', to: '/appeals', keywords: 'murojaat savol javob обращение' },
      { title: t('nav.review'), icon: 'mdi-account-search-outline', to: '/tekshirish', keywords: 'tekshirish guruh temperament проверка' },
      { title: t('nav.calendar'), icon: 'mdi-calendar-heart', to: '/calendar', keywords: 'qabul slot bo\'sh band приём календарь' },
      { title: t('nav.assign'), icon: 'mdi-clipboard-plus-outline', to: '/assignments/create', keywords: 'biriktirish tayinlash yangi назначить' },
      { title: t('nav.assignments'), icon: 'mdi-clipboard-check-outline', to: '/assignments', keywords: 'biriktirilgan guruh назначения' },
      { title: t('nav.statistics'), icon: 'mdi-chart-timeline-variant', to: '/statistics', keywords: 'hisobot qamrov статистика' },
    ]

    if (auth.isAdmin) {
      items.push({ title: t('nav.accessRequests'), icon: 'mdi-account-key-outline', to: '/admin/access-requests', keywords: 'kirish so\'rov ruxsat tasdiq xodim доступ' })
      items.push({ title: t('nav.organization'), icon: 'mdi-sitemap-outline', to: '/admin/organization', keywords: 'fakultet guruh talaba tuzilma структура' })
    }

    return items
  })

  const allNav = computed<NavItem[]>(() => {
    const seen = new Set<string>()

    return [...mainNav.value, ...staffNav.value].filter((item) => {
      if (seen.has(item.to)) {
        return false
      }

      seen.add(item.to)

      return true
    })
  })

  return { mainNav, staffNav, allNav }
}
