<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { setLocale } from '@/i18n'
import type { UserRole } from '@/types/domain'

const { t, locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()

// Dev-only: HEMIS assigns the role automatically once real OAuth login
// exists (TZ §2.1) — this picker just lets every role's screens be tested
// in the meantime.
const devRole = ref<UserRole>('student')
const roleOptions: { value: UserRole; label: string; icon: string }[] = [
  { value: 'student', label: 'Talaba', icon: 'mdi-school-outline' },
  { value: 'psychologist', label: 'Psixolog', icon: 'mdi-account-tie-outline' },
  { value: 'admin', label: 'Admin', icon: 'mdi-shield-crown-outline' },
]

async function handleHemisLogin() {
  await auth.signInWithHemis(devRole.value)
  router.push('/')
}
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

    <v-card class="login-card" elevation="8">
      <div class="mb-6">
        <v-avatar color="primary" size="52" rounded="lg" class="mb-4">
          <v-icon icon="mdi-brain" color="white" size="28" />
        </v-avatar>
        <h1 class="text-display text-h4 font-weight-600 mb-2">{{ t('auth.title') }}</h1>
        <p class="text-body-2 text-medium-emphasis">{{ t('auth.subtitle') }}</p>
      </div>

      <div class="dev-role-picker mb-5">
        <span class="text-caption font-weight-700 text-medium-emphasis text-uppercase d-block mb-2">
          <v-icon icon="mdi-flask-outline" size="14" class="mr-1" />Demo rejim — rol tanlang
        </span>
        <v-btn-toggle v-model="devRole" mandatory color="primary" density="comfortable" rounded="lg" class="d-flex" divided>
          <v-btn v-for="opt in roleOptions" :key="opt.value" :value="opt.value" class="flex-grow-1 text-none" size="small">
            <v-icon :icon="opt.icon" start size="16" />
            {{ opt.label }}
          </v-btn>
        </v-btn-toggle>
      </div>

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
  max-width: 420px;
  padding: 40px 36px;
  border-radius: 20px;
}
</style>
