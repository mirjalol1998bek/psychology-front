import { defineStore } from 'pinia'
import type { AuthUser } from '@/types/domain'

const STORAGE_KEY = 'psy.auth.user'

/**
 * TODO(backend): replace with real HEMIS OAuth2 flow (TZ §2.1) —
 * redirect to /oauth/authorize, exchange the returned code for a token via
 * the Symfony API, then store the JWT it issues. The mock user below only
 * exists so the rest of the app can be built and demoed before that API
 * exists.
 */
const MOCK_USER: AuthUser = {
  id: 'demo-student-1',
  role: 'student',
  hemis: {
    hemisId: '38210300123',
    fullName: 'Madina Yusupova',
    faculty: 'Xorijiy filologiya fakulteti',
    group: '21-FIL-14',
    studyLanguage: 'uz',
  },
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as AuthUser | null,
    isSigningIn: false,
  }),
  getters: {
    isAuthenticated: (state) => state.user !== null,
  },
  actions: {
    async signInWithHemis() {
      this.isSigningIn = true
      try {
        // Simulated network round-trip to the (not-yet-built) HEMIS OAuth callback.
        await new Promise((resolve) => setTimeout(resolve, 700))
        this.user = MOCK_USER
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.user))
      } finally {
        this.isSigningIn = false
      }
    },
    signOut() {
      this.user = null
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})
