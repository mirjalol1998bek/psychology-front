<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { setLocale } from '@/i18n'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

// Harakatsizlik tufayli sessiya tugagach, router `?reason=idle` bilan qaytaradi.
const idleNotice = computed(() => route.query.reason === 'idle')

// HEMIS — asosiy yo'l (rolni HEMIS profili beradi); email/parol — HEMIS'da
// bo'lmagan hisoblar (masalan CLI orqali yaratilgan admin) uchun.
type Mode = 'hemis' | 'password'
const mode = ref<Mode>('hemis')

function handleHemisLogin() {
  // Real OAuth2: leaves the SPA, backend redirects to HEMIS, returns to /auth/hemis.
  auth.startHemisLogin()
}

const loginError = ref('')

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(true)

async function handlePasswordLogin() {
  loginError.value = ''
  if (!username.value.trim() || !password.value) {
    loginError.value = t('auth.enterEmailPassword')
    return
  }
  const ok = await auth.signInWithPassword(username.value, password.value)
  if (!ok) {
    loginError.value = t('auth.wrongCredentials')
    return
  }
  router.push('/')
}
</script>

<template>
  <div class="login-screen">
    <div class="login-langswitch">
      <v-btn-toggle
        :model-value="locale"
        density="comfortable"
        rounded="lg"
        variant="outlined"
        mandatory
        color="primary"
        @update:model-value="(v) => setLocale(v as 'uz' | 'ru')"
      >
        <v-btn value="uz" size="small">UZ</v-btn>
        <v-btn value="ru" size="small">RU</v-btn>
      </v-btn-toggle>
    </div>

    <!-- Hero brand: big, centred university emblem above everything -->
    <div class="login-brand">
      <div class="login-logo-halo">
        <img src="/logo-utjhu.png" alt="UzDJTU" class="login-logo" />
      </div>
      <h1 class="text-display text-h4 font-weight-bold mt-5 mb-1">{{ t('app.name') }}</h1>
      <p class="text-body-1 mb-0" style="max-width: 38ch; opacity: 0.85">{{ t('app.tagline') }}</p>
    </div>

    <div class="login-grid">
      <!-- Reassurance points -->
      <aside class="login-aside d-none d-md-flex">
        <ul class="login-points">
          <li><v-icon icon="mdi-lock-check-outline" size="18" class="mr-2" />{{ t('auth.points.confidential') }}</li>
          <li><v-icon icon="mdi-clipboard-text-outline" size="18" class="mr-2" />{{ t('auth.points.tests') }}</li>
          <li><v-icon icon="mdi-calendar-heart" size="18" class="mr-2" />{{ t('auth.points.appointments') }}</li>
        </ul>
      </aside>

      <!-- Auth card -->
      <v-card class="login-card surface-card" rounded="lg">
        <div class="mb-6">
          <h2 class="text-display text-h5 font-weight-bold mb-1">{{ t('auth.title') }}</h2>
          <p class="text-body-2 text-medium-emphasis mb-0">{{ t('auth.subtitle') }}</p>
        </div>

        <v-alert
          v-if="idleNotice"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-6"
          icon="mdi-timer-sand"
        >
          {{ t('auth.idleLogout') }}
        </v-alert>

        <v-btn-toggle
          v-model="mode"
          mandatory
          color="primary"
          density="comfortable"
          rounded="lg"
          variant="outlined"
          class="d-flex mb-6"
        >
          <v-btn value="hemis" class="flex-grow-1" size="small">
            <v-icon icon="mdi-shield-account-outline" start size="16" />Hemis
          </v-btn>
          <v-btn value="password" class="flex-grow-1" size="small">
            <v-icon icon="mdi-account-key-outline" start size="16" />{{ t('auth.passwordLogin') }}
          </v-btn>
        </v-btn-toggle>

        <div v-if="mode === 'hemis'">
          <v-btn
            block
            size="large"
            color="primary"
            class="font-weight-bold"
            :loading="auth.isSigningIn"
            @click="handleHemisLogin"
          >
            <v-icon icon="mdi-shield-account-outline" start />
            {{ t('auth.hemisLogin') }}
          </v-btn>
          <p class="text-caption text-medium-emphasis mt-4 mb-0 d-flex" style="gap: 6px">
            <v-icon icon="mdi-information-outline" size="14" style="margin-top: 2px" />
            <span>{{ t('auth.hemisHint') }}</span>
          </p>
        </div>

        <form v-else @submit.prevent="handlePasswordLogin">
          <v-text-field
            v-model="username"
            :label="t('auth.emailLabel')"
            type="email"
            prepend-inner-icon="mdi-email-outline"
            class="mb-1"
            autocomplete="username"
          />
          <v-text-field
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            :label="t('auth.passwordLabel')"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
            autocomplete="current-password"
            @click:append-inner="showPassword = !showPassword"
          />
          <div class="d-flex align-center justify-space-between mb-4">
            <v-switch v-model="rememberMe" color="primary" density="compact" hide-details :label="t('auth.rememberMe')" />
          </div>

          <v-alert v-if="loginError" type="error" variant="tonal" density="compact" class="mb-4">
            {{ loginError }}
          </v-alert>

          <v-btn type="submit" block size="large" color="primary" class="font-weight-bold" :loading="auth.isSigningIn">
            {{ t('auth.signInBtn') }}
          </v-btn>
        </form>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.login-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--gradient-page);
  padding: 24px;
}

/* Soft decorative brand glow, sitting behind the hero + card. */
.login-screen::before,
.login-screen::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.16;
  pointer-events: none;
  z-index: 0;
}
.login-screen::before {
  width: 480px;
  height: 480px;
  top: -180px;
  left: -140px;
  background: rgb(var(--v-theme-primary));
}
.login-screen::after {
  width: 420px;
  height: 420px;
  bottom: -160px;
  right: -120px;
  background: rgb(var(--v-theme-secondary));
}

.login-langswitch {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 2;
}

.login-brand {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 40px;
}

.login-logo-halo {
  width: 148px;
  height: 148px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(
    circle,
    color-mix(in srgb, rgb(var(--v-theme-primary)) 14%, transparent) 0%,
    transparent 72%
  );
}

.login-logo {
  width: 116px;
  height: 116px;
  object-fit: contain;
  filter: drop-shadow(0 8px 20px rgba(var(--v-theme-primary), 0.28));
}

.login-grid {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 940px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  align-items: center;
}

@media (min-width: 960px) {
  .login-grid {
    grid-template-columns: 1fr 420px;
    gap: 64px;
  }
}

.login-aside {
  flex-direction: column;
  align-items: flex-start;
  color: rgb(var(--v-theme-on-background));
}

.login-points {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.login-points li {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.login-card {
  padding: 36px 32px;
}
</style>
