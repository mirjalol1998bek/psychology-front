import axios, { type AxiosInstance } from 'axios'

/**
 * Shared HTTP client for the Symfony/API-Platform backend.
 *
 * Dev: Vite proxies `/api` → http://localhost:8508 (vite.config.ts), so the
 * baseURL is just `/api` and cookies/CORS are a non-issue.
 *
 * Auth: JWT access token in `Authorization: Bearer`. On 401 we try the
 * refresh token once; if that fails the caller is signed out.
 */

const ACCESS_KEY = 'psy.auth.access'
const REFRESH_KEY = 'psy.auth.refresh'

export const tokenStore = {
  access: (): string | null => safeGet(ACCESS_KEY),
  refresh: (): string | null => safeGet(REFRESH_KEY),
  set(access: string, refresh: string) {
    safeSet(ACCESS_KEY, access)
    safeSet(REFRESH_KEY, refresh)
  },
  clear() {
    safeRemove(ACCESS_KEY)
    safeRemove(REFRESH_KEY)
  },
}

function safeGet(k: string): string | null {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
function safeSet(k: string, v: string) {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* private mode — session only */
  }
}
function safeRemove(k: string) {
  try {
    localStorage.removeItem(k)
  } catch {
    /* ignore */
  }
}

let onAuthLost: (() => void) | null = null
export function setAuthLostHandler(fn: () => void) {
  onAuthLost = fn
}

export const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/ld+json' },
})

api.interceptors.request.use((config) => {
  const token = tokenStore.access()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStore.refresh()
  if (!refresh) return null
  try {
    const { data } = await axios.post(
      '/api/users/auth/refreshToken',
      { refreshToken: refresh },
      { headers: { 'Content-Type': 'application/ld+json' } },
    )
    const access = data.accessToken as string
    const newRefresh = (data.refreshToken as string) ?? refresh
    tokenStore.set(access, newRefresh)
    return access
  } catch {
    return null
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true
      refreshing = refreshing ?? refreshAccessToken()
      const access = await refreshing
      refreshing = null
      if (access) {
        original.headers.Authorization = `Bearer ${access}`
        return api(original)
      }
      tokenStore.clear()
      onAuthLost?.()
    }
    return Promise.reject(error)
  },
)
