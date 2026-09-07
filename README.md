# Psixodiagnostika — Frontend

Universitet talabalari uchun psixologik test, kuzatuv va konsultatsiya platformasining frontend qismi. Mavjud `dashboard-uzswlu` loyihasidagi psixologiya moduliga alohida, mustaqil almashtiruvchi sifatida ishlab chiqilmoqda.

## Stek

- **Vue 3** + `<script setup lang="ts">` — hamma joyda TypeScript
- **Vuetify 4** (Material Design) — tayyor, zamonaviy komponent kutubxonasi; loyihaga xos custom CSS minimal darajada ushlanadi (`src/styles/global.css`)
- **Vue Router**, **Pinia**, **vue-i18n** (uz/ru), **axios**
- **Vite**

## Dizayn tizimi — "Calm care"

Universitet psixologik xizmati uchun tinch, ishonchli va insoniy ko'rinish:

- **Ranglar** — `src/plugins/vuetify.ts` da ikkita to'liq tema. Asosiy rang: to'q feruza (`#0E7C6B`), iliq krem fon, bosiq yordamchi ranglar. Neon/yaltiroq effektlardan voz kechilgan.
- **Rejim** — yorug' / qorong'i / tizim bo'yicha. `src/composables/useThemeMode.ts` tanlovni saqlaydi va OS `prefers-color-scheme` o'zgarishini kuzatadi. App bar'dagi menyudan almashtiriladi.
- **Shriftlar** — sarlavhalar uchun *Source Serif 4* (uz + ru), matn uchun *Inter*.
- **Yuzalar** — `global.css` dagi `.surface-card` (qattiq fon + yumshoq soya), `.surface-sunken`, `.icon-tile` (`--tint` bilan). Shisha-morfizm va aylanuvchi globus olib tashlangan.
- **Metodika ranglari** — temperament / psixogeometrik shakl tuslari `src/utils/instruments.ts` da, ikkala temada o'qiladigan bosiq tonlar.

## Loyiha tuzilmasi

```
src/
  i18n/            vue-i18n sozlamasi
  locales/         uz.ts, ru.ts tarjima fayllari
  layouts/         DefaultLayout.vue — navigatsiya drawer + app bar
  plugins/         vuetify.ts — tema (rang palitrasi, komponent defaultlari)
  router/          marshrutlar va auth guard
  stores/          Pinia store'lar (hozircha auth — mock HEMIS login)
  types/           domain.ts — Quiz/Question/Option/Attempt kabi tiplar,
                   InstrumentType orqali skorlash arxitekturasiga bog'liq
  views/
    auth/          LoginView.vue
    tests/         TestsListView.vue, TakeTestView.vue
    results/       ResultsView.vue
    calendar/       CalendarView.vue
    DashboardView.vue, NotFoundView.vue
```

## Joriy holat

Bu — vizual va arxitektura fundamenti: tema, layout, marshrutlash, ko'p tillilik, va asosiy ekranlarning namoyish (mock ma'lumotli) versiyalari. Real backend (Symfony + API Platform, HEMIS OAuth2) hali mavjud emas — shu sabab:

- `src/stores/auth.ts` HEMIS login oqimini simulyatsiya qiladi (`TODO(backend)` izohi bilan belgilangan);
- sahifalardagi ro'yxatlar (`TestsListView`, `DashboardView`, `CalendarView`, `ResultsView`) namunaviy ma'lumotlar bilan to'ldirilgan — API tayyor bo'lgach `axios` orqali servis qatlamiga ulanadi.

## Ishga tushirish

```bash
npm install
npm run dev
```

`.env.example` faylini `.env`ga nusxalab, backend manzillarini kiriting.

## Keyingi qadamlar

1. `src/services/` — HEMIS OAuth va psixologiya API uchun axios klientlar (mavjud `dashboard-uzswlu/src/config/apiClients.js` patterniga mos)
2. Har bir `InstrumentType` uchun savol-render va natija-render komponentlari (`src/views/tests/instruments/*`)
3. So'rovnoma konstruktori va PDF eksport oqimi
4. Admin/psixolog rollari uchun alohida marshrut guruhi
