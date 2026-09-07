<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="nf-screen">
    <div class="nf-inner">
      <div class="gradient-accent icon-badge mb-5" style="width: 56px; height: 56px; border-radius: 18px">
        <v-icon icon="mdi-compass-off-outline" size="28" />
      </div>
      <div class="text-display text-h2 font-weight-bold mb-1">404</div>
      <h1 class="text-display text-h5 font-weight-bold mb-2">Sahifa topilmadi</h1>
      <p class="text-body-2 text-medium-emphasis mb-6" style="max-width: 40ch">
        Siz izlayotgan manzil mavjud emas yoki ko‘chirilgan.
      </p>
      <div class="d-flex flex-wrap justify-center" style="gap: 10px">
        <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="router.back()">Orqaga</v-btn>
        <v-btn color="primary" to="/">Bosh sahifaga qaytish</v-btn>
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
  background: rgb(var(--v-theme-background));
}
.nf-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
</style>
