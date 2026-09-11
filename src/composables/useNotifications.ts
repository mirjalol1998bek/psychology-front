import { onMounted, onUnmounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/apiClient'
import { members } from '@/services/quizService'

/**
 * Bell notifications, backed by the API:
 *   GET  /api/notifications             — the current user's notifications
 *   POST /api/notifications/mark_read   — mark all as read
 *
 * The backend creates them on appeal-new (→ psychologists/admins) and
 * appeal-reply (→ the student). State is module-level so every mount of this
 * composable (app bar, pages) shares one badge count.
 */

export interface NotifItem {
  id: string
  title: string
  body: string
  at: string
  to: string
  isRead: boolean
}

interface BackendNotification {
  id: number
  title: string
  body: string
  link?: string | null
  isRead: boolean
  createdAt: string
}

const items = ref<NotifItem[]>([])
const unreadCount = ref(0)
let polling = 0

function mapNotification(n: BackendNotification): NotifItem {
  return {
    id: String(n.id),
    title: n.title,
    body: n.body,
    at: n.createdAt,
    to: n.link || '/appeals',
    isRead: !!n.isRead,
  }
}

async function refresh() {
  try {
    const raw = members<BackendNotification>((await api.get('/notifications')).data)
    items.value = raw.slice(0, 15).map(mapNotification)
    unreadCount.value = raw.filter((n) => !n.isRead).length
  } catch {
    /* not authenticated yet, or offline */
  }
}

/**
 * Call when the acting identity changes (login, impersonation start/stop,
 * sign-out) — `items`/`unreadCount` are module-level and otherwise keep
 * showing the previous identity's notifications until the next 45s poll.
 */
export function resetNotifications() {
  items.value = []
  unreadCount.value = 0
  refresh()
}

async function markRead() {
  if (unreadCount.value === 0) return
  try {
    await api.post('/notifications/mark_read', null)
    items.value = items.value.map((i) => ({ ...i, isRead: true }))
    unreadCount.value = 0
  } catch {
    /* ignore */
  }
}

export function useNotifications() {
  const auth = useAuthStore()

  onMounted(() => {
    if (auth.isAuthenticated) refresh()
    if (!polling) {
      polling = window.setInterval(() => {
        if (auth.isAuthenticated) refresh()
      }, 45_000)
    }
  })

  onUnmounted(() => {
    if (polling) {
      clearInterval(polling)
      polling = 0
    }
  })

  return { items, unreadCount, markRead, refresh }
}
