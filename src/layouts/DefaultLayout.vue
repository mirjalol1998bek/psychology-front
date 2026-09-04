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
const rail = ref(false)

const roleLabel = computed(() => ({ student: 'Talaba', psychologist: 'Psixolog', admin: 'Admin' })[auth.user?.role ?? 'student'])

const navItems = computed(() => {
  const items = [
    { title: t('nav.dashboard'), icon: 'mdi-view-dashboard-outline', to: '/' },
    { title: t('nav.tests'), icon: 'mdi-clipboard-text-outline', to: '/tests' },
    { title: t('nav.results'), icon: 'mdi-chart-donut', to: '/results' },
    { title: t('nav.calendar'), icon: 'mdi-calendar-heart', to: '/calendar' },
  ]
  if (auth.isStaff) {
    items.push(
      { title: t('nav.assignments'), icon: 'mdi-clipboard-check-outline', to: '/assignments' },
      { title: t('nav.statistics'), icon: 'mdi-chart-box-outline', to: '/statistics' },
    )
  }
  return items
})

function toggleTheme() {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
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
  <v-app>
    <v-navigation-drawer v-model="drawer" :rail="rail" permanent border="0" elevation="2">
      <div class="d-flex align-center pa-4" style="gap: 10px">
        <v-avatar color="primary" size="34" rounded="lg">
          <v-icon icon="mdi-brain" color="white" size="20" />
        </v-avatar>
        <span v-if="!rail" class="text-display text-subtitle-1 font-weight-600">{{ t('app.name') }}</span>
      </div>

      <div v-if="!rail" class="px-4 pb-3">
        <v-chip size="small" variant="tonal" :color="auth.isStaff ? 'secondary' : 'primary'" prepend-icon="mdi-badge-account-outline">
          {{ roleLabel }}
        </v-chip>
      </div>

      <v-divider />

      <v-list nav density="comfortable" class="pa-2">
        <v-list-item
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          rounded="lg"
          class="mb-1"
          color="primary"
        />
      </v-list>

      <template #append>
        <div class="pa-2">
          <v-list nav density="comfortable">
            <v-list-item
              :prepend-icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
              :title="rail ? '' : t('common.back')"
              rounded="lg"
              @click="rail = !rail"
            />
          </v-list>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar flat border="0" density="comfortable">
      <v-app-bar-nav-icon class="d-md-none" @click="drawer = !drawer" />
      <v-toolbar-title class="text-display font-weight-600">
        {{ (navItems.find((n) => n.to === route.path))?.title ?? t('app.name') }}
      </v-toolbar-title>

      <v-spacer />

      <v-btn icon variant="text" @click="toggleLocale">
        <span class="text-caption font-weight-700">{{ locale.toUpperCase() }}</span>
      </v-btn>

      <v-btn icon variant="text" @click="toggleTheme">
        <v-icon :icon="theme.global.current.value.dark ? 'mdi-weather-sunny' : 'mdi-weather-night'" />
      </v-btn>

      <v-menu v-if="auth.user">
        <template #activator="{ props }">
          <v-btn variant="text" v-bind="props" class="ml-1">
            <v-avatar color="secondary" size="32" class="mr-2">
              <span class="text-caption font-weight-700 text-white">{{ initials }}</span>
            </v-avatar>
            <span class="d-none d-sm-inline">{{ auth.user.hemis.fullName }}</span>
          </v-btn>
        </template>
        <v-list density="comfortable" min-width="220">
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
