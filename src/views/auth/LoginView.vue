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

// Ikkala usul ham — Hemis va login/parol — talaba, psixolog va adminning
// hammasi uchun ochiq (TZ §2.1). Real tizimda rolni Hemis profilining o'zi
// belgilaydi; backend hali yo'qligi sababli demo uchun shu yerda tanlanadi.
type Mode = 'hemis' | 'password'
const mode = ref<Mode>('hemis')

const hemisRole = ref<UserRole>('student')
const hemisRoleOptions: { value: UserRole; label: string; icon: string }[] = [
  { value: 'student', label: 'Talaba', icon: 'mdi-school-outline' },
  { value: 'psychologist', label: 'Psixolog', icon: 'mdi-account-tie-outline' },
  { value: 'admin', label: 'Admin', icon: 'mdi-shield-crown-outline' },
]

async function handleHemisLogin() {
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
    <div class="login-backdrop">
      <svg class="blob" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path
          fill="currentColor"
          d="M431,305Q412,360,367,398Q322,436,265,447Q208,458,159,424Q110,390,90,336Q70,282,95,228Q120,174,167,138Q214,102,271,101Q328,100,373,135Q418,170,433,225Q448,280,431,305Z"
        />
      </svg>
    </div>

    <div class="login-langswitch">
      <v-btn-toggle
        :model-value="locale"
        density="comfortable"
        rounded="lg"
        mandatory
        color="primary"
        @update:model-value="(v) => setLocale(v as 'uz' | 'ru')"
      >
        <v-btn value="uz" size="small">UZ</v-btn>
        <v-btn value="ru" size="small">RU</v-btn>
      </v-btn-toggle>
    </div>

    <v-card class="login-card surface-glass" rounded="xl">
      <div class="mb-5">
        <div class="gradient-accent icon-badge mb-4" style="width: 52px; height: 52px; border-radius: 16px">
          <v-icon icon="mdi-brain" color="white" size="26" />
        </div>
        <h1 class="text-display text-h4 font-weight-800 mb-2">{{ t('auth.title') }}</h1>
        <p class="text-body-2 text-medium-emphasis">{{ t('auth.subtitle') }}</p>
      </div>

      <v-btn-toggle v-model="mode" mandatory color="primary" density="comfortable" rounded="lg" class="d-flex mb-5" divided>
        <v-btn value="hemis" class="flex-grow-1 text-none" size="small">
          <v-icon icon="mdi-shield-account-outline" start size="16" />Hemis orqali
        </v-btn>
        <v-btn value="password" class="flex-grow-1 text-none" size="small">
          <v-icon icon="mdi-account-key-outline" start size="16" />Login va parol
        </v-btn>
      </v-btn-toggle>

      <!-- HEMIS: talaba, psixolog va admin — barchasi shu orqali kira oladi -->
      <div v-if="mode === 'hemis'">
        <span class="text-caption font-weight-700 text-medium-emphasis text-uppercase d-block mb-2">
          <v-icon icon="mdi-account-outline" size="14" class="mr-1" />Kim sifatida kirasiz?
        </span>
        <v-btn-toggle v-model="hemisRole" mandatory color="primary" density="comfortable" rounded="lg" class="d-flex mb-5" divided>
          <v-btn v-for="opt in hemisRoleOptions" :key="opt.value" :value="opt.value" class="flex-grow-1 text-none" size="small">
            <v-icon :icon="opt.icon" start size="16" />{{ opt.label }}
          </v-btn>
        </v-btn-toggle>

        <v-btn
          block
          size="x-large"
          color="primary"
          class="text-none font-weight-700"
          :loading="auth.isSigningIn"
          @click="handleHemisLogin"
        >
          <v-icon icon="mdi-shield-account-outline" start />
          {{ t('auth.hemisLogin') }}
        </v-btn>
        <p class="text-caption text-medium-emphasis mt-4 mb-0">
          <v-icon icon="mdi-information-outline" size="14" class="mr-1" />
          {{ t('auth.hemisHint') }}
        </p>
      </div>

      <!-- Login/parol: talaba, psixolog va admin — barchasi uchun -->
      <form v-else @submit.prevent="handlePasswordLogin">
        <v-text-field
          v-model="username"
          label="Login"
          prepend-inner-icon="mdi-account-outline"
          density="comfortable"
          class="mb-1"
          autocomplete="username"
        />
        <v-text-field
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          label="Parol"
          prepend-inner-icon="mdi-lock-outline"
          :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
          density="comfortable"
          autocomplete="current-password"
          @click:append-inner="showPassword = !showPassword"
        />
        <div class="d-flex align-center justify-space-between mb-4">
          <v-switch v-model="rememberMe" color="primary" density="compact" hide-details label="Meni eslab qol" />
        </div>

        <v-alert v-if="loginError" type="error" variant="tonal" density="compact" class="mb-4">{{ loginError }}</v-alert>

        <v-btn type="submit" block size="x-large" color="primary" class="text-none font-weight-700" :loading="auth.isSigningIn">
          Kirish
        </v-btn>

        <div class="demo-hint mt-4">
          <span class="text-caption font-weight-700 text-medium-emphasis text-uppercase d-block mb-2">
            <v-icon icon="mdi-flask-outline" size="14" class="mr-1" />Demo hisoblar (sinov uchun)
          </span>
          <div class="d-flex flex-column" style="gap: 6px">
            <button
              v-for="c in DEMO_CREDENTIALS" :key="c.username" type="button"
              class="demo-cred-row" @click="fillDemo(c)"
            >
              <v-chip size="x-small" variant="tonal" color="secondary" class="mr-2">{{ roleLabel[c.role] }}</v-chip>
              <span class="mono">{{ c.username }} / {{ c.password }}</span>
            </button>
          </div>
        </div>
      </form>
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
  background: rgb(var(--v-theme-background));
  padding: 24px;
}

.login-backdrop {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.blob {
  width: min(880px, 140vw);
  height: min(880px, 140vw);
  color: rgb(var(--v-theme-primary));
  opacity: 0.08;
}

.login-langswitch {
  position: absolute;
  top: 20px;
  right: 20px;
}

.login-card {
  position: relative;
  width: 100%;
  max-width: 440px;
  padding: 40px 36px;
  border-radius: 20px;
}

.demo-cred-row {
  display: flex;
  align-items: center;
  background: rgba(128, 128, 128, 0.1);
  border: 1px solid rgba(128, 128, 128, 0.18);
  border-radius: 10px;
  padding: 6px 10px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;
}
.demo-cred-row:hover {
  background: rgba(0, 117, 255, 0.14);
}
.mono {
  font-family: ui-monospace, monospace;
  font-size: 12px;
}
</style>
