import { defineStore } from 'pinia'
import type { AuthUser, UserRole } from '@/types/domain'

const STORAGE_KEY = 'psy.auth.user'

/**
 * TODO(backend): replace with real HEMIS OAuth2 flow (TZ §2.1) —
 * redirect to /oauth/authorize, exchange the returned code for a token via
 * the Symfony API, then read the role HEMIS returns (lavozim/status). The
 * mock users below only exist so every role's screens can be built and
 * demoed before that API exists — the role picker on the login screen is a
 * dev-only affordance and disappears once real HEMIS login lands.
 */
const MOCK_USERS: Record<UserRole, AuthUser> = {
  student: {
    id: 'demo-student-1',
    role: 'student',
    hemis: {
      hemisId: '38210300123',
      fullName: 'Madina Yusupova',
      faculty: 'Xorijiy filologiya fakulteti',
      group: '21-FIL-14',
      studyLanguage: 'uz',
    },
  },
  psychologist: {
    id: 'demo-psych-1',
    role: 'psychologist',
    hemis: {
      hemisId: 'employee-40021',
      fullName: 'Nilufar Egamova',
      faculty: 'Psixologiya xizmati',
      group: '—',
      studyLanguage: 'uz',
    },
  },
  admin: {
    id: 'demo-admin-1',
    role: 'admin',
    hemis: {
      hemisId: 'employee-10004',
      fullName: 'Sardor Aliyev',
      faculty: 'Bosh administrator',
      group: '—',
      studyLanguage: 'uz',
    },
  },
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as AuthUser | null,
    isSigningIn: false,
  }),
  getters: {
    isAuthenticated: (state) => state.user !== null,
    isStaff: (state) => state.user?.role === 'psychologist' || state.user?.role === 'admin',
  },
  actions: {
    async signInWithHemis(role: UserRole = 'student') {
      this.isSigningIn = true
      try {
        // Simulated network round-trip to the (not-yet-built) HEMIS OAuth callback.
        await new Promise((resolve) => setTimeout(resolve, 700))
        this.user = MOCK_USERS[role]
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
