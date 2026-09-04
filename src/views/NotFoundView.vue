<template>
  <v-empty-state
    icon="mdi-compass-off-outline"
    headline="404"
    title="Sahifa topilmadi"
    text="Siz izlayotgan manzil mavjud emas yoki ko‘chirilgan."
  >
    <template #actions>
      <v-btn color="primary" class="text-none" to="/">Bosh sahifaga qaytish</v-btn>
    </template>
  </v-empty-state>
</template>
