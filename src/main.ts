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

// On an irrecoverable 401, drop the session and return to the login screen.
// (The router guard resolves a stored JWT into a profile before each route.)
const auth = useAuthStore()
setAuthLostHandler(() => {
  auth.signOut()
  router.replace({ name: 'login' })
})

app.mount('#app')
