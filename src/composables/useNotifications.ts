import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAppealsStore } from '@/stores/appeals'

/**
 * Bell notifications, driven by the appeals channel:
 *  - student → an unread item for every reply received since they last looked
 *  - staff   → an unread item for every appeal opened since they last looked
 * "Last looked" is a per-user timestamp in localStorage; opening the bell
 * menu (or the appeals page) marks everything read.
 */

const KEY = (k: string) => `psy.notif.seen.${k}`

// Reactive per-user "seen" timestamp so the badge updates without a reload.
const seenAt = ref<Record<string, string>>({})

function loadSeen(userKey: string): string {
  if (seenAt.value[userKey] === undefined) {
    seenAt.value[userKey] = localStorage.getItem(KEY(userKey)) ?? '1970-01-01T00:00:00.000Z'
  }
  return seenAt.value[userKey]
}

export interface NotifItem {
  id: string
  title: string
  body: string
  at: string
  to: string
}

export function useNotifications() {
  const auth = useAuthStore()
  const appeals = useAppealsStore()

  const userKey = computed(() => auth.user?.hemis.hemisId ?? 'anon')

  const items = computed<NotifItem[]>(() => {
    if (!auth.user) return []
    if (auth.isStaff) {
      return appeals.ordered
        .filter((a) => a.status === 'open')
        .slice(0, 8)
        .map((a) => ({
          id: a.id,
          title: a.mode === 'anonymous' ? 'Anonim talaba' : a.studentName,
          body: a.message,
          at: a.createdAt,
          to: '/appeals',
        }))
    }
    return appeals
      .forStudent(userKey.value)
      .filter((a) => a.reply)
      .slice(0, 8)
      .map((a) => ({
        id: a.id,
        title: `${a.repliedBy} javob berdi`,
        body: a.reply ?? '',
        at: a.repliedAt ?? a.createdAt,
        to: '/appeals',
      }))
  })

  const unreadCount = computed(() => {
    const seen = loadSeen(userKey.value)
    return items.value.filter((i) => i.at > seen).length
  })

  function markRead() {
    const now = new Date().toISOString()
    seenAt.value = { ...seenAt.value, [userKey.value]: now }
    try {
      localStorage.setItem(KEY(userKey.value), now)
    } catch {
      /* ignore */
    }
  }

  return { items, unreadCount, markRead }
}
