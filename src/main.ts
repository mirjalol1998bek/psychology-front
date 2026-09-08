import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { i18n } from './i18n'
import { setAuthLostHandler, tokenStore } from './services/apiClient'
import { useAuthStore } from './stores/auth'

import './styles/global.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.use(i18n)

// If a HEMIS/JWT session exists, revalidate it against the backend on boot;
// on irrecoverable 401 send the user back to the login screen.
const auth = useAuthStore()
setAuthLostHandler(() => {
  auth.signOut()
  router.replace({ name: 'login' })
})
if (tokenStore.access()) {
  void auth.fetchMe()
}

app.mount('#app')
