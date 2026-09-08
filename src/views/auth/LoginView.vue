<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore, DEMO_CREDENTIALS } from '@/stores/auth'
import { setLocale } from '@/i18n'
import type { UserRole } from '@/types/domain'

const { t, locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()

// Both paths — Hemis and login/password — are open to every role (TZ §2.1).
// In production Hemis itself carries the role; until the backend exists we
// pick it here for the demo.
type Mode = 'hemis' | 'password'
const mode = ref<Mode>('hemis')

const hemisRole = ref<UserRole>('student')
const hemisRoleOptions: { value: UserRole; label: string; icon: string }[] = [
  { value: 'student', label: 'Talaba', icon: 'mdi-school-outline' },
  { value: 'psychologist', label: 'Psixolog', icon: 'mdi-account-tie-outline' },
  { value: 'admin', label: 'Admin', icon: 'mdi-shield-crown-outline' },
]

function handleHemisLogin() {
  // Real OAuth2: leaves the SPA, backend redirects to HEMIS, returns to /auth/hemis.
  auth.startHemisLogin()
}

async function handleDemoLogin() {
  await auth.signInWithHemis(hemisRole.value)
  router.push('/')
}

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(true)
const loginError = ref('')

async function handlePasswordLogin() {
  loginError.value = ''
  if (!username.value.trim() || !password.value) {
    loginError.value = 'Login va parolni kiriting.'
    return
  }
  const ok = await auth.signInWithPassword(username.value, password.value)
  if (!ok) {
    loginError.value = 'Login yoki parol noto‘g‘ri.'
    return
  }
  router.push('/')
}

function fillDemo(cred: (typeof DEMO_CREDENTIALS)[number]) {
  username.value = cred.username
  password.value = cred.password
  loginError.value = ''
}

const roleLabel: Record<string, string> = { admin: 'Admin', psychologist: 'Psixolog', student: 'Talaba' }
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

    <div class="login-grid">
      <!-- Brand / reassurance panel -->
      <aside class="login-aside d-none d-md-flex">
        <div class="gradient-accent icon-badge mb-6" style="width: 52px; height: 52px; border-radius: 16px">
          <v-icon icon="mdi-head-heart-outline" size="26" />
        </div>
        <h2 class="text-display text-h4 font-weight-bold mb-3">{{ t('app.name') }}</h2>
        <p class="text-body-1 mb-8" style="max-width: 34ch; opacity: 0.9">{{ t('app.tagline') }}</p>
        <ul class="login-points">
          <li><v-icon icon="mdi-lock-check-outline" size="18" class="mr-2" />Ma’lumotlaringiz maxfiy saqlanadi</li>
          <li><v-icon icon="mdi-clipboard-text-outline" size="18" class="mr-2" />Psixologik testlar va xulosalar</li>
          <li><v-icon icon="mdi-calendar-heart" size="18" class="mr-2" />Psixolog bilan qabulga yozilish</li>
        </ul>
      </aside>

      <!-- Auth card -->
      <v-card class="login-card surface-card" rounded="lg">
        <div class="mb-6">
          <div class="gradient-accent icon-badge mb-4 d-md-none" style="width: 46px; height: 46px; border-radius: 14px">
            <v-icon icon="mdi-head-heart-outline" size="23" />
          </div>
          <h1 class="text-display text-h5 font-weight-bold mb-1">{{ t('auth.title') }}</h1>
          <p class="text-body-2 text-medium-emphasis mb-0">{{ t('auth.subtitle') }}</p>
        </div>

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

          <div class="demo-hint mt-5">
            <span class="text-caption font-weight-bold text-medium-emphasis text-uppercase d-block mb-2">
              Demo — API'siz kirish (sinov uchun)
            </span>
            <v-btn-toggle
              v-model="hemisRole"
              mandatory
              color="primary"
              density="comfortable"
              rounded="lg"
              variant="outlined"
              class="d-flex mb-3"
            >
              <v-btn v-for="opt in hemisRoleOptions" :key="opt.value" :value="opt.value" class="flex-grow-1" size="small">
                <v-icon :icon="opt.icon" start size="16" />{{ opt.label }}
              </v-btn>
            </v-btn-toggle>
            <v-btn block variant="tonal" size="small" :loading="auth.isSigningIn" @click="handleDemoLogin">
              Demo hisob bilan davom etish
            </v-btn>
          </div>
        </div>

        <form v-else @submit.prevent="handlePasswordLogin">
          <v-text-field
            v-model="username"
            label="Login"
            prepend-inner-icon="mdi-account-outline"
            class="mb-1"
            autocomplete="username"
          />
          <v-text-field
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            label="Parol"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
            autocomplete="current-password"
            @click:append-inner="showPassword = !showPassword"
          />
          <div class="d-flex align-center justify-space-between mb-4">
            <v-switch v-model="rememberMe" color="primary" density="compact" hide-details label="Meni eslab qol" />
          </div>

          <v-alert v-if="loginError" type="error" variant="tonal" density="compact" class="mb-4">
            {{ loginError }}
          </v-alert>

          <v-btn type="submit" block size="large" color="primary" class="font-weight-bold" :loading="auth.isSigningIn">
            Kirish
          </v-btn>

          <div class="demo-hint mt-5">
            <span class="text-caption font-weight-bold text-medium-emphasis text-uppercase d-block mb-2">
              Demo hisoblar (sinov uchun)
            </span>
            <div class="d-flex flex-column" style="gap: 6px">
              <button
                v-for="c in DEMO_CREDENTIALS"
                :key="c.username"
                type="button"
                class="demo-cred-row"
                @click="fillDemo(c)"
              >
                <v-chip size="x-small" variant="tonal" color="primary" class="mr-2">{{ roleLabel[c.role] }}</v-chip>
                <span class="mono">{{ c.username }} / {{ c.password }}</span>
              </button>
            </div>
          </div>
        </form>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.login-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: rgb(var(--v-theme-background));
  padding: 24px;
}

.login-langswitch {
  position: absolute;
  top: 20px;
  right: 20px;
}

.login-grid {
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

.demo-cred-row {
  display: flex;
  align-items: center;
  background: rgb(var(--v-theme-surface-variant));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 10px;
  padding: 7px 10px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s var(--ease);
}
.demo-cred-row:hover {
  border-color: rgb(var(--v-theme-primary));
}
.mono {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 12px;
}
</style>
