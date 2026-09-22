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

    <v-card class="login-shell" rounded="lg">
      <!-- Brand panel: gradient + texture, logo, reassurance points — all in one place -->
      <div class="login-panel-brand">
        <div class="login-panel-pattern" aria-hidden="true" />
        <div class="login-panel-content">
          <div class="login-logo-badge">
            <img src="/logo-utjhu.png" alt="UzDJTU" class="login-logo" />
          </div>
          <h1 class="text-display text-h4 font-weight-bold mb-2">{{ t('app.name') }}</h1>
          <p class="text-body-1 mb-8" style="max-width: 32ch; opacity: 0.88">{{ t('app.tagline') }}</p>

          <ul class="login-points">
            <li>
              <span class="login-point-icon"><v-icon icon="mdi-lock-check-outline" size="16" /></span>
              {{ t('auth.points.confidential') }}
            </li>
            <li>
              <span class="login-point-icon"><v-icon icon="mdi-clipboard-text-outline" size="16" /></span>
              {{ t('auth.points.tests') }}
            </li>
            <li>
              <span class="login-point-icon"><v-icon icon="mdi-calendar-heart" size="16" /></span>
              {{ t('auth.points.appointments') }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Form panel -->
      <div class="login-panel-form">
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
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.login-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--gradient-page);
  padding: 24px;
}

/* Soft decorative brand glow, sitting behind the card. */
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

/* One unified split card — brand story and the form share the same
   surface, instead of the reassurance points floating loose on the page. */
.login-shell {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 920px;
  display: grid;
  grid-template-columns: 1fr;
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

@media (min-width: 900px) {
  .login-shell {
    grid-template-columns: 5fr 6fr;
  }
}

.login-panel-brand {
  position: relative;
  overflow: hidden;
  padding: 44px 36px 36px;
  background: var(--gradient-accent);
  color: #fff;
  display: flex;
  align-items: center;
}

/* Soft dot-grid texture over the gradient — the bit of "creative" life a
   flat brand panel was missing. */
.login-panel-pattern {
  position: absolute;
  inset: -20%;
  background-image: radial-gradient(rgba(255, 255, 255, 0.35) 1.5px, transparent 1.5px);
  background-size: 22px 22px;
  opacity: 0.25;
  transform: rotate(-8deg);
  pointer-events: none;
}
.login-panel-brand::after {
  content: '';
  position: absolute;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  bottom: -120px;
  right: -80px;
  pointer-events: none;
}

.login-panel-content {
  position: relative;
  z-index: 1;
}

.login-logo-badge {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  margin-bottom: 22px;
}

.login-logo {
  width: 54px;
  height: 54px;
  object-fit: contain;
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
  gap: 12px;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.92);
}
.login-point-icon {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.login-panel-form {
  background: rgb(var(--v-theme-surface));
  padding: 44px 36px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

@media (max-width: 899px) {
  .login-panel-brand {
    padding: 36px 28px 28px;
  }
  .login-panel-form {
    padding: 36px 28px;
  }
}
</style>
