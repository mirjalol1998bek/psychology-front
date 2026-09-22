<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
</script>

<template>
  <div class="nf-screen">
    <div class="nf-inner">
      <div class="gradient-accent icon-badge mb-5" style="width: 56px; height: 56px; border-radius: 18px">
        <v-icon icon="mdi-compass-off-outline" size="28" />
      </div>
      <div class="text-display text-h2 font-weight-bold mb-1">404</div>
      <h1 class="text-display text-h5 font-weight-bold mb-2">{{ t('notFound.title') }}</h1>
      <p class="text-body-2 text-medium-emphasis mb-6" style="max-width: 40ch">
        {{ t('notFound.text') }}
      </p>
      <div class="d-flex flex-wrap justify-center" style="gap: 10px">
        <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="router.back()">{{ t('common.back') }}</v-btn>
        <v-btn color="primary" to="/">{{ t('notFound.home') }}</v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nf-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--gradient-page);
}
.nf-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
</style>
