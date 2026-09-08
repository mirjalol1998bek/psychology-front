import { defineStore } from 'pinia'
import type { AuthUser, HemisProfile, UserRole } from '@/types/domain'
import { api, tokenStore } from '@/services/apiClient'

const STORAGE_KEY = 'psy.auth.user'
const IMPERSONATOR_KEY = 'psy.auth.impersonator'

/** Maps the Symfony User payload (/api/users/about_me) to our AuthUser. */
function mapBackendUser(u: Record<string, unknown>): AuthUser {
  const roles = (u.roles as string[]) ?? []
  const role: UserRole = roles.includes('ROLE_ADMIN')
    ? 'admin'
    : roles.includes('ROLE_PSYCHOLOGIST')
      ? 'psychologist'
      : 'student'
  const group = u.studyGroup as { name?: string; faculty?: { name?: string } } | null
  const faculty = u.faculty as { name?: string } | null
  return {
    id: String(u.id ?? u['@id'] ?? ''),
    role,
    hemis: {
      hemisId: (u.hemisId as string) ?? (u.email as string) ?? '',
      fullName: (u.fullName as string) ?? (u.email as string) ?? '',
      faculty: faculty?.name ?? group?.faculty?.name ?? '—',
      group: group?.name ?? '—',
      studyLanguage: (u.studyLanguage as 'uz' | 'ru') ?? 'uz',
      image: (u.image as string) ?? undefined,
    },
  }
}

/**
 * TODO(backend): replace with real HEMIS OAuth2 flow (TZ §2.1) —
 * redirect to /oauth/authorize, exchange the returned code for a token via
 * the Symfony API, then read the role HEMIS returns (lavozim/status). The
 * mock users below only exist so every role's screens can be built and
 * demoed before that API exists.
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

/**
 * Login/parol orqali kirish — HEMISga ega bo'lmagan xodimlar (admin,
 * psixolog) va sinov uchun yaratilgan "test talaba" hisobi shu yo'l bilan
 * kiradi. TODO(backend): POST /auth/login (Symfony/LexikJWT) — bu yerda
 * faqat demo hisoblar bilan mock tekshiruv.
 */
interface Credential {
  username: string
  password: string
  role: UserRole
}
export const DEMO_CREDENTIALS: Credential[] = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'psixolog', password: 'psixolog123', role: 'psychologist' },
  { username: 'talaba.test', password: 'talaba123', role: 'student' },
]

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as AuthUser | null,
    // When an admin is "viewing as a student" to test a flow, the admin's
    // own account is parked here so they can switch straight back.
    impersonator: JSON.parse(sessionStorage.getItem(IMPERSONATOR_KEY) ?? 'null') as AuthUser | null,
    isSigningIn: false,
  }),
  getters: {
    isAuthenticated: (state) => state.user !== null,
    isStaff: (state) => state.user?.role === 'psychologist' || state.user?.role === 'admin',
    isAdmin: (state) => state.user?.role === 'admin',
    isImpersonating: (state) => state.impersonator !== null,
  },
  actions: {
    /** Admin-only: switch into a student view (built from a created student). */
    viewAsStudent(profile: Pick<HemisProfile, 'fullName' | 'hemisId' | 'faculty' | 'group' | 'studyLanguage'>) {
      if (this.user && this.user.role === 'admin' && !this.impersonator) {
        this.impersonator = this.user
        sessionStorage.setItem(IMPERSONATOR_KEY, JSON.stringify(this.user))
      }
      this.user = {
        id: `view-${profile.hemisId}`,
        role: 'student',
        hemis: { ...profile },
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.user))
    },
    /** Return from a student view to the parked admin account. */
    stopImpersonating() {
      if (!this.impersonator) return
      this.user = this.impersonator
      this.impersonator = null
      sessionStorage.removeItem(IMPERSONATOR_KEY)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.user))
    },
    /** Real HEMIS OAuth2: hand off to the backend, which redirects to HEMIS. */
    startHemisLogin() {
      window.location.href = '/api/auth/hemis'
    },
    /**
     * Called by the HEMIS callback route once the backend has redirected back
     * with `#access=...&refresh=...`. Stores the JWTs and loads the profile.
     */
    async completeHemisLogin(access: string, refresh: string): Promise<boolean> {
      this.isSigningIn = true
      try {
        tokenStore.set(access, refresh)
        return await this.fetchMe()
      } finally {
        this.isSigningIn = false
      }
    },
    /** Loads the authenticated user from the backend using the stored JWT. */
    async fetchMe(): Promise<boolean> {
      if (!tokenStore.access()) return false
      try {
        const { data } = await api.post('/users/about_me')
        this.user = mapBackendUser(data)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.user))
        return true
      } catch {
        tokenStore.clear()
        this.user = null
        localStorage.removeItem(STORAGE_KEY)
        return false
      }
    },
    /** Demo/mock HEMIS login — kept for offline development without the API. */
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
    /** Returns true on success, false on invalid credentials. */
    async signInWithPassword(username: string, password: string): Promise<boolean> {
      this.isSigningIn = true
      try {
        await new Promise((resolve) => setTimeout(resolve, 500))
        const match = DEMO_CREDENTIALS.find(
          (c) => c.username.toLowerCase() === username.trim().toLowerCase() && c.password === password,
        )
        if (!match) return false
        this.user = MOCK_USERS[match.role]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.user))
        return true
      } finally {
        this.isSigningIn = false
      }
    },
    signOut() {
      this.user = null
      this.impersonator = null
      tokenStore.clear()
      localStorage.removeItem(STORAGE_KEY)
      sessionStorage.removeItem(IMPERSONATOR_KEY)
    },
  },
})
