<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useTheme } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import { setLocale } from '@/i18n'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const theme = useTheme()
const auth = useAuthStore()

const drawer = ref(true)
const isDark = computed(() => theme.global.current.value.dark)

const roleLabel = computed(() => ({ student: 'Talaba', psychologist: 'Psixolog', admin: 'Admin' })[auth.user?.role ?? 'student'])

const mainNav = computed(() => [
  { title: t('nav.dashboard'), icon: 'mdi-view-grid-outline', to: '/' },
  { title: t('nav.tests'), icon: 'mdi-clipboard-text-outline', to: '/tests' },
  { title: t('nav.results'), icon: 'mdi-chart-donut', to: '/results' },
  { title: t('nav.calendar'), icon: 'mdi-calendar-heart', to: '/calendar' },
])

const staffNav = computed(() =>
  auth.isStaff
    ? [
        { title: 'Tekshirish', icon: 'mdi-magnify-scan', to: '/tekshirish' },
        { title: 'Test biriktirish', icon: 'mdi-clipboard-plus-outline', to: '/assignments/create' },
        { title: t('nav.assignments'), icon: 'mdi-clipboard-check-outline', to: '/assignments' },
        { title: t('nav.statistics'), icon: 'mdi-chart-box-outline', to: '/statistics' },
      ]
    : [],
)

const currentTitle = computed(
  () => [...mainNav.value, ...staffNav.value].find((n) => n.to === route.path)?.title ?? t('app.name'),
)

function toggleTheme() {
  theme.global.name.value = isDark.value ? 'light' : 'dark'
}

function toggleLocale() {
  setLocale(locale.value === 'uz' ? 'ru' : 'uz')
}

function handleLogout() {
  auth.signOut()
  router.push('/login')
}

const initials = computed(() => {
  const name = auth.user?.hemis.fullName ?? ''
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})
</script>

<template>
  <div class="app-backdrop" v-if="isDark" />
  <v-app>
    <v-navigation-drawer v-model="drawer" permanent border="0" width="260" class="app-sidebar">
      <div class="d-flex align-center pa-5 pb-4" style="gap: 10px">
        <div class="gradient-accent icon-badge" style="width: 36px; height: 36px; border-radius: 11px">
          <v-icon icon="mdi-brain" color="white" size="19" />
        </div>
        <span class="text-display text-subtitle-1 font-weight-800">{{ t('app.name') }}</span>
      </div>

      <div class="px-5 pb-4">
        <v-chip
          size="small"
          variant="flat"
          :color="auth.isStaff ? 'secondary' : 'primary'"
          prepend-icon="mdi-badge-account-outline"
          class="font-weight-700"
        >
          {{ roleLabel }}
        </v-chip>
      </div>

      <v-list nav density="comfortable" class="px-3 nav-list">
        <v-list-item
          v-for="item in mainNav"
          :key="item.to"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          rounded="lg"
          class="mb-1 nav-item"
          :class="{ 'nav-item--active': route.path === item.to }"
        />
      </v-list>

      <template v-if="staffNav.length">
        <div class="px-6 pt-4 pb-2 text-caption font-weight-700 text-medium-emphasis" style="letter-spacing: .08em">
          BOSHQARUV
        </div>
        <v-list nav density="comfortable" class="px-3 nav-list">
          <v-list-item
            v-for="item in staffNav"
            :key="item.to"
            :to="item.to"
            :prepend-icon="item.icon"
            :title="item.title"
            rounded="lg"
            class="mb-1 nav-item"
            :class="{ 'nav-item--active': route.path === item.to }"
          />
        </v-list>
      </template>

      <template #append>
        <div class="pa-4">
          <v-card class="pa-4 surface-glass" rounded="xl">
            <v-icon icon="mdi-lifebuoy" color="secondary" size="22" class="mb-2" />
            <div class="text-body-2 font-weight-700 mb-1">Yordam kerakmi?</div>
            <p class="text-caption text-medium-emphasis mb-3">Qo‘llanma va ko‘rsatmalarni ko‘ring.</p>
            <v-btn size="small" block variant="tonal" color="secondary" class="text-none">Qo‘llanma</v-btn>
          </v-card>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar flat border="0" density="comfortable" class="app-topbar">
      <v-app-bar-nav-icon class="d-md-none" @click="drawer = !drawer" />

      <div class="d-none d-sm-flex flex-column ml-2">
        <span class="text-caption text-medium-emphasis">
          <v-icon icon="mdi-home-outline" size="12" class="mr-1" />{{ t('app.name') }} /
        </span>
        <span class="text-display text-h6 font-weight-800">{{ currentTitle }}</span>
      </div>

      <v-spacer />

      <v-text-field
        density="compact"
        variant="solo"
        rounded="pill"
        hide-details
        placeholder="Qidirish..."
        prepend-inner-icon="mdi-magnify"
        class="topbar-search mr-3 d-none d-md-flex"
        flat
        max-width="240"
      />

      <v-btn icon variant="text" @click="toggleLocale">
        <span class="text-caption font-weight-700">{{ locale.toUpperCase() }}</span>
      </v-btn>

      <v-btn icon variant="text" @click="toggleTheme">
        <v-icon :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'" />
      </v-btn>

      <v-btn icon variant="text">
        <v-badge color="error" dot offset-x="2" offset-y="2">
          <v-icon icon="mdi-bell-outline" />
        </v-badge>
      </v-btn>

      <v-menu v-if="auth.user">
        <template #activator="{ props }">
          <v-btn variant="text" v-bind="props" class="ml-1">
            <v-avatar color="primary" size="32" class="mr-2 gradient-accent">
              <span class="text-caption font-weight-700 text-white">{{ initials }}</span>
            </v-avatar>
            <span class="d-none d-sm-inline">{{ auth.user.hemis.fullName }}</span>
          </v-btn>
        </template>
        <v-list density="comfortable" min-width="220" class="surface-glass" rounded="lg">
          <v-list-item :title="auth.user.hemis.faculty" :subtitle="auth.user.hemis.group" />
          <v-divider />
          <v-list-item :title="t('common.logout')" prepend-icon="mdi-logout" @click="handleLogout" />
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-4 pa-md-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.app-sidebar,
.app-topbar {
  background: transparent !important;
}

.nav-item :deep(.v-list-item-title) {
  font-weight: 600;
  font-size: 0.9rem;
}

.nav-item :deep(.v-icon) {
  opacity: 0.75;
}

.nav-item--active {
  background: var(--gradient-accent);
  box-shadow: 0 8px 20px -8px rgba(0, 117, 255, 0.55);
}

.nav-item--active :deep(.v-list-item-title),
.nav-item--active :deep(.v-icon) {
  color: #fff !important;
  opacity: 1;
}

.topbar-search :deep(.v-field) {
  background: rgba(128, 128, 128, 0.12);
}
</style>
