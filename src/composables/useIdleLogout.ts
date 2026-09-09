import { onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * Foydalanuvchi 5 daqiqa davomida hech qanday harakat qilmasa (sichqoncha,
 * klaviatura, skroll, teginish), sessiyani tugatib login sahifasiga qaytaradi.
 *
 * Oxirgi faollik vaqti `localStorage` da saqlanadi — shu sababli bir nechta
 * ochilgan tabda bittasidagi harakat hammasini faol saqlaydi, chiqib ketish
 * ham barcha tablarga tarqaladi.
 *
 * DefaultLayout'dan chaqiriladi, ya'ni faqat tizimga kirilgan holatda ishlaydi.
 */

const IDLE_LIMIT_MS = 5 * 60 * 1000
const CHECK_INTERVAL_MS = 15 * 1000
const WRITE_THROTTLE_MS = 5 * 1000
const ACTIVITY_KEY = 'psy.auth.lastActivity'
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'] as const

function readLastActivity(): number {
  try {
    const value = Number(localStorage.getItem(ACTIVITY_KEY))

    return Number.isFinite(value) && value > 0 ? value : Date.now()
  } catch {
    return Date.now()
  }
}

function writeLastActivity(timestamp: number): void {
  try {
    localStorage.setItem(ACTIVITY_KEY, String(timestamp))
  } catch {
    /* private mode / storage disabled — the timer still works within this tab */
  }
}

export function useIdleLogout() {
  const auth = useAuthStore()
  const router = useRouter()

  let checkTimer = 0
  let lastWrite = 0

  function markActive(): void {
    const now = Date.now()

    if (now - lastWrite < WRITE_THROTTLE_MS) {
      return
    }

    lastWrite = now
    writeLastActivity(now)
  }

  function expire(): void {
    stop()
    auth.signOut()

    if (router.currentRoute.value.name !== 'login') {
      router.push({ name: 'login', query: { reason: 'idle' } })
    }
  }

  function check(): void {
    if (!auth.isAuthenticated) {
      return
    }

    if (Date.now() - readLastActivity() >= IDLE_LIMIT_MS) {
      expire()
    }
  }

  function onVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      check()
    }
  }

  function start(): void {
    lastWrite = Date.now()
    writeLastActivity(lastWrite)

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, markActive, { passive: true }))
    document.addEventListener('visibilitychange', onVisibilityChange)
    checkTimer = window.setInterval(check, CHECK_INTERVAL_MS)
  }

  function stop(): void {
    ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, markActive))
    document.removeEventListener('visibilitychange', onVisibilityChange)

    if (checkTimer) {
      clearInterval(checkTimer)
      checkTimer = 0
    }
  }

  onMounted(start)
  onBeforeUnmount(stop)
}
