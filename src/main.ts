import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { i18n } from './i18n'
import { setAuthLostHandler } from './services/apiClient'
import { useAuthStore } from './stores/auth'

import './styles/global.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.use(i18n)

// Deploydan keyin eski sahifasi ochiq qolgan foydalanuvchi yangi build'da endi
// yo'q bo'lak (chunk) faylini so'raydi — sahifa ochilmay qolardi. Bir marta
// yangilab, yangi versiyani yuklaymiz (test javoblari serverda saqlangan).
// 10 soniyalik qo'riqchi — fayl haqiqatan yo'q bo'lsa cheksiz qayta yuklanmasin.
const RELOAD_KEY = 'psy.chunkReloadAt'
function reloadForNewVersion(target?: string) {
  try {
    if (Date.now() - Number(sessionStorage.getItem(RELOAD_KEY) ?? 0) < 10_000) return
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    /* sessionStorage yo'q — baribir bir marta urinib ko'ramiz */
  }
  if (target) window.location.assign(target)
  else window.location.reload()
}
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  reloadForNewVersion()
})
router.onError((error, to) => {
  const message = String((error as Error)?.message ?? error)
  if (/dynamically imported module|module script failed/i.test(message)) reloadForNewVersion(to.fullPath)
})

// On an irrecoverable 401, drop the session and return to the login screen.
// (The router guard resolves a stored JWT into a profile before each route.)
const auth = useAuthStore()
setAuthLostHandler(() => {
  auth.signOut()
  router.replace({ name: 'login' })
})

app.mount('#app')
