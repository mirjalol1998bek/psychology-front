import { defineStore } from 'pinia'
import type { AuthUser, HemisProfile, UserRole } from '@/types/domain'
import { api, tokenStore } from '@/services/apiClient'
import { useAppealsStore } from './appeals'
import { usePassportStore } from './passport'
import { useCalendarStore } from './calendar'
import { useOrganizationStore } from './organization'
import { resetNotifications } from '@/composables/useNotifications'

const STORAGE_KEY = 'psy.auth.user'
const IMPERSONATOR_KEY = 'psy.auth.impersonator'

/**
 * Every store above caches its last fetch behind a `loaded` flag ("the API
 * already scopes the collection to the current user"). That's only true
 * while the acting identity stays the same — impersonating a different
 * student (or signing out) must throw the cache away, or the new identity's
 * pages render the *previous* identity's data (e.g. another student's
 * appeals) until something else forces a reload.
 */
function resetUserScopedStores() {
  useAppealsStore().$reset()
  usePassportStore().$reset()
  useCalendarStore().$reset()
  useOrganizationStore().$reset()
  resetNotifications()
}

/** Maps the Symfony User payload (/api/users/about_me) to our AuthUser. */
function mapBackendUser(u: Record<string, unknown>): AuthUser {
  const roles = (u.roles as string[]) ?? []
  const role: UserRole = roles.includes('ROLE_ADMIN')
    ? 'admin'
    : roles.includes('ROLE_PSYCHOLOGIST')
      ? 'psychologist'
      : roles.includes('ROLE_TUTOR')
        ? 'tutor'
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
    isTutor: (state) => state.user?.role === 'tutor',
    isImpersonating: (state) => state.impersonator !== null,
  },
  actions: {
    /**
     * Admin-only: view the app as a real student. `studentId` is the backend
     * User id; the API mints a short student JWT (POST /students/{id}/impersonate).
     */
    async impersonateStudent(studentId: number): Promise<boolean> {
      if (this.user?.role !== 'admin') return false
      try {
        const { data } = await api.post(`/students/${studentId}/impersonate`)
        if (!this.impersonator) {
          this.impersonator = this.user
          sessionStorage.setItem(IMPERSONATOR_KEY, JSON.stringify(this.user))
          sessionStorage.setItem('psy.auth.impersonator.tokens', JSON.stringify({
            access: tokenStore.access(),
            refresh: tokenStore.refresh(),
          }))
        }
        tokenStore.set(data.accessToken, data.refreshToken)
        resetUserScopedStores()
        return await this.fetchMe()
      } catch {
        return false
      }
    },
    /** Mock "view as" for the still-mock admin org screen (no API access). */
    viewAsStudent(profile: Pick<HemisProfile, 'fullName' | 'hemisId' | 'faculty' | 'group' | 'studyLanguage'>) {
      if (this.user && this.user.role === 'admin' && !this.impersonator) {
        this.impersonator = this.user
        sessionStorage.setItem(IMPERSONATOR_KEY, JSON.stringify(this.user))
      }
      this.user = { id: `view-${profile.hemisId}`, role: 'student', hemis: { ...profile } }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.user))
      resetUserScopedStores()
    },
    /** Return from a student view to the parked admin account. */
    stopImpersonating() {
      if (!this.impersonator) return
      try {
        const t = JSON.parse(sessionStorage.getItem('psy.auth.impersonator.tokens') ?? 'null')
        if (t?.access) tokenStore.set(t.access, t.refresh)
      } catch {
        /* mock impersonation had no tokens */
      }
      sessionStorage.removeItem('psy.auth.impersonator.tokens')
      this.user = this.impersonator
      this.impersonator = null
      sessionStorage.removeItem(IMPERSONATOR_KEY)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.user))
      resetUserScopedStores()
    },
    /** Real HEMIS OAuth2: hand off to the backend, which redirects to HEMIS. */
    /** Talaba va xodim HEMIS'da alohida portaldan kiradi (bitta OAuth klient). */
    startHemisLogin(portal: 'student' | 'employee') {
      window.location.href = `/api/auth/hemis?portal=${portal}`
    },
    /**
     * Called by the HEMIS callback route once the backend has redirected back
     * with `#access=...&refresh=...`. Stores the JWTs and loads the profile.
     */
    async completeHemisLogin(access: string, refresh: string): Promise<boolean> {
      this.isSigningIn = true
      try {
        tokenStore.set(access, refresh)
        resetUserScopedStores()
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
    /** Email + password against POST /api/users/auth. Returns true on success. */
    async signInWithPassword(email: string, password: string): Promise<boolean> {
      this.isSigningIn = true
      try {
        const { data } = await api.post('/users/auth', { email: email.trim(), password })
        tokenStore.set(data.accessToken, data.refreshToken)
        resetUserScopedStores()
        return await this.fetchMe()
      } catch {
        return false
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
      sessionStorage.removeItem('psy.auth.impersonator.tokens')
      resetUserScopedStores()
    },
  },
})
