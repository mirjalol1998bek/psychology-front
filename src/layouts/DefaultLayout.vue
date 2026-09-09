<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import { setLocale } from '@/i18n'
import { useThemeMode, type ThemeMode } from '@/composables/useThemeMode'
import { useNotifications } from '@/composables/useNotifications'
import { useIdleLogout } from '@/composables/useIdleLogout'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { mobile } = useDisplay()
const { mode, setMode } = useThemeMode()
const { items: notifItems, unreadCount: notifUnread, markRead: markNotifRead } = useNotifications()

// 5 daqiqa harakatsizlikdan keyin login sahifasiga chiqaradi.
useIdleLogout()

const drawer = ref(!mobile.value)

const roleLabel = computed(
  () =>
    ({ student: t('role.student'), psychologist: t('role.psychologist'), admin: t('role.admin') })[
      auth.user?.role ?? 'student'
    ],
)

const mainNav = computed(() => {
  const items = [
    { title: t('nav.dashboard'), icon: 'mdi-view-dashboard-outline', to: '/' },
    { title: t('nav.tests'), icon: 'mdi-clipboard-text-outline', to: '/tests' },
    { title: t('nav.results'), icon: 'mdi-chart-box-outline', to: '/results' },
  ]
  if (!auth.isStaff) {
    items.push({ title: t('nav.passport'), icon: 'mdi-card-account-details-outline', to: '/passport' })
    items.push({ title: t('nav.appeals'), icon: 'mdi-message-text-outline', to: '/appeals' })
  }
  return items
})

// The appointment calendar is staff-only — a student sees their own next
// slot on the dashboard instead. The organization editor is admin-only.
const staffNav = computed(() => {
  if (!auth.isStaff) return []
  const items = [
    { title: t('nav.appeals'), icon: 'mdi-message-text-outline', to: '/appeals' },
    { title: t('nav.review'), icon: 'mdi-account-search-outline', to: '/tekshirish' },
    { title: t('nav.calendar'), icon: 'mdi-calendar-heart', to: '/calendar' },
    { title: t('nav.assign'), icon: 'mdi-clipboard-plus-outline', to: '/assignments/create' },
    { title: t('nav.assignments'), icon: 'mdi-clipboard-check-outline', to: '/assignments' },
    { title: t('nav.statistics'), icon: 'mdi-chart-timeline-variant', to: '/statistics' },
  ]
  if (auth.isAdmin) {
    items.push({ title: t('nav.accessRequests'), icon: 'mdi-account-key-outline', to: '/admin/access-requests' })
    items.push({ title: t('nav.organization'), icon: 'mdi-sitemap-outline', to: '/admin/organization' })
  }
  return items
})

const currentTitle = computed(() => {
  const all = [...mainNav.value, ...staffNav.value]
  const exact = all.find((n) => n.to === route.path)
  if (exact) return exact.title
  // Detail routes (e.g. /results/temperament/f1/g1) inherit their section's title.
  const section = all
    .filter((n) => n.to !== '/' && route.path.startsWith(n.to))
    .sort((a, b) => b.to.length - a.to.length)[0]
  return section?.title ?? t('app.name')
})

const themeOptions: { value: ThemeMode; icon: string }[] = [
  { value: 'light', icon: 'mdi-white-balance-sunny' },
  { value: 'dark', icon: 'mdi-weather-night' },
  { value: 'system', icon: 'mdi-laptop' },
]
const themeIcon = computed(
  () => ({ light: 'mdi-white-balance-sunny', dark: 'mdi-weather-night', system: 'mdi-laptop' })[mode.value],
)

function toggleLocale() {
  setLocale(locale.value === 'uz' ? 'ru' : 'uz')
}

function handleLogout() {
  auth.signOut()
  router.push('/login')
}

function returnToAdmin() {
  auth.stopImpersonating()
  router.push('/admin/organization')
}

const initials = computed(() =>
  (auth.user?.hemis.fullName ?? '')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase(),
)
</script>

<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      :permanent="!mobile"
      :temporary="mobile"
      border="0"
      width="264"
      class="app-sidebar"
    >
      <div class="d-flex align-center px-5 pt-5 pb-4" style="gap: 11px">
        <div class="gradient-accent icon-badge" style="width: 36px; height: 36px; border-radius: 11px">
          <v-icon icon="mdi-head-heart-outline" size="20" />
        </div>
        <span class="text-display text-subtitle-1 font-weight-bold">{{ t('app.name') }}</span>
      </div>

      <div class="px-5 pb-3">
        <v-chip size="small" variant="tonal" color="primary" prepend-icon="mdi-shield-account-outline">
          {{ roleLabel }}
        </v-chip>
      </div>

      <v-list nav density="comfortable" class="px-3 pt-1">
        <v-list-item
          v-for="item in mainNav"
          :key="item.to"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          rounded="lg"
          class="mb-1 nav-item"
          :active="route.path === item.to"
          exact
        />
      </v-list>

      <template v-if="staffNav.length">
        <div class="px-6 pt-4 pb-1 text-overline text-medium-emphasis">{{ t('nav.section') }}</div>
        <v-list nav density="comfortable" class="px-3">
          <v-list-item
            v-for="item in staffNav"
            :key="item.to"
            :to="item.to"
            :prepend-icon="item.icon"
            :title="item.title"
            rounded="lg"
            class="mb-1 nav-item"
            :active="route.path === item.to"
          />
        </v-list>
      </template>

      <template #append>
        <div class="pa-4">
          <div class="surface-sunken pa-4" style="border-radius: var(--radius)">
            <v-icon icon="mdi-lifebuoy" color="primary" size="20" class="mb-2" />
            <div class="text-body-2 font-weight-bold mb-1">{{ t('help.title') }}</div>
            <p class="text-caption text-medium-emphasis mb-3">{{ t('help.body') }}</p>
            <v-btn size="small" block variant="tonal" color="primary">{{ t('help.action') }}</v-btn>
          </div>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar flat border="0" height="68" class="app-topbar">
      <v-app-bar-nav-icon v-if="mobile" @click="drawer = !drawer" />

      <div class="d-flex flex-column ml-2 ml-md-1">
        <span class="text-caption text-medium-emphasis d-none d-sm-flex align-center">
          <v-icon icon="mdi-home-outline" size="12" class="mr-1" />{{ t('app.name') }}
        </span>
        <span class="text-display text-h6 font-weight-bold" style="line-height: 1.15">{{ currentTitle }}</span>
      </div>

      <v-spacer />

      <v-text-field
        density="compact"
        variant="solo-filled"
        rounded="lg"
        hide-details
        flat
        :placeholder="t('common.search')"
        prepend-inner-icon="mdi-magnify"
        class="topbar-search mr-2 d-none d-md-flex"
        max-width="230"
        bg-color="surface-variant"
      />

      <v-btn variant="text" size="small" class="px-2" @click="toggleLocale">
        <span class="text-caption font-weight-bold">{{ locale.toUpperCase() }}</span>
      </v-btn>

      <v-menu location="bottom end">
        <template #activator="{ props }">
          <v-btn icon variant="text" v-bind="props" :aria-label="t('theme.label')">
            <v-icon :icon="themeIcon" />
          </v-btn>
        </template>
        <v-list density="compact" min-width="188" class="surface-card" nav>
          <v-list-subheader>{{ t('theme.label') }}</v-list-subheader>
          <v-list-item
            v-for="opt in themeOptions"
            :key="opt.value"
            :prepend-icon="opt.icon"
            :title="t('theme.' + opt.value)"
            :active="mode === opt.value"
            @click="setMode(opt.value)"
          />
        </v-list>
      </v-menu>

      <v-menu location="bottom end" :close-on-content-click="false" @update:model-value="(o) => o && markNotifRead()">
        <template #activator="{ props }">
          <v-btn icon variant="text" v-bind="props" :aria-label="t('common.notifications')">
            <v-badge :model-value="notifUnread > 0" :content="notifUnread" color="error" offset-x="2" offset-y="2">
              <v-icon :icon="notifUnread > 0 ? 'mdi-bell-ring-outline' : 'mdi-bell-outline'" />
            </v-badge>
          </v-btn>
        </template>
        <v-list density="comfortable" min-width="320" max-width="380" class="surface-card" nav>
          <v-list-subheader>{{ t('common.notifications') }}</v-list-subheader>
          <template v-if="notifItems.length">
            <v-list-item
              v-for="n in notifItems"
              :key="n.id"
              :to="n.to"
              lines="two"
              prepend-icon="mdi-message-reply-text-outline"
            >
              <v-list-item-title class="text-body-2 font-weight-bold">{{ n.title }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption" style="-webkit-line-clamp: 2">{{ n.body }}</v-list-item-subtitle>
            </v-list-item>
          </template>
          <v-list-item v-else class="text-body-2 text-medium-emphasis">
            {{ t('common.noNotifications') }}
          </v-list-item>
        </v-list>
      </v-menu>

      <v-menu v-if="auth.user" location="bottom end">
        <template #activator="{ props }">
          <v-btn variant="text" v-bind="props" class="ml-1 px-1">
            <v-avatar size="32" class="gradient-accent">
              <span class="text-caption font-weight-bold">{{ initials }}</span>
            </v-avatar>
            <span class="d-none d-sm-inline ml-2 text-body-2 font-weight-medium">{{ auth.user.hemis.fullName }}</span>
          </v-btn>
        </template>
        <v-list density="comfortable" min-width="232" class="surface-card" nav>
          <v-list-item
            :title="auth.user.hemis.fullName"
            :subtitle="auth.user.hemis.faculty"
            prepend-icon="mdi-account-circle-outline"
          />
          <v-divider class="my-1" />
          <v-list-item :title="t('common.logout')" prepend-icon="mdi-logout" base-color="error" @click="handleLogout" />
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <div v-if="auth.isImpersonating" class="impersonation-bar">
        <v-icon icon="mdi-account-eye-outline" size="18" />
        <span class="text-body-2">
          Siz <strong>{{ auth.user?.hemis.fullName }}</strong> talaba sifatida ko‘ryapsiz
        </span>
        <v-spacer />
        <v-btn size="small" variant="outlined" @click="returnToAdmin">Adminga qaytish</v-btn>
      </div>
      <v-container :key="route.path" class="page-container page-fade pa-4 pa-md-6 pa-lg-8">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.app-sidebar {
  background: rgb(var(--v-theme-surface)) !important;
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
}

.app-topbar {
  background: rgb(var(--v-theme-surface)) !important;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
}

.page-container {
  max-width: 1280px;
}

.impersonation-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 20px;
  background: rgb(var(--v-theme-warning));
  color: #1c1200;
}
.impersonation-bar :deep(.v-btn) {
  color: #1c1200;
}

.nav-item {
  min-height: 42px;
}

.nav-item :deep(.v-list-item-title) {
  font-size: 0.9rem;
  font-weight: 500;
}

.nav-item :deep(.v-icon) {
  opacity: 0.7;
}

.nav-item.v-list-item--active {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.nav-item.v-list-item--active :deep(.v-list-item-title) {
  font-weight: 600;
}

.nav-item.v-list-item--active :deep(.v-icon) {
  opacity: 1;
}

.topbar-search :deep(.v-field) {
  font-size: 0.875rem;
}

/* Keyed on route path — re-runs a quiet fade-in on each navigation without
   wrapping the async <router-view> in a <transition> (which can blank the
   view when a lazily-loaded route component resolves). */
.page-fade {
  animation: page-fade-in 0.18s var(--ease) both;
}
@keyframes page-fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
}
</style>
