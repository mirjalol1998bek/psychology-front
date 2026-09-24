import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { tokenStore } from '@/services/apiClient'
import type { UserRole } from '@/types/domain'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    roles?: UserRole[]
  }
}

const STAFF: UserRole[] = ['psychologist', 'admin']
const ADMIN: UserRole[] = ['admin']

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { public: true },
    },
    {
      // HEMIS OAuth2 return target. The backend redirects here with the JWTs
      // in the URL fragment (#access=...&refresh=...).
      path: '/auth/hemis',
      name: 'hemis-callback',
      component: () => import('@/views/auth/HemisCallbackView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/DefaultLayout.vue'),
      children: [
        { path: '', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },

        // Testlar: staff = management list/builder, student = take-test cards.
        { path: 'tests', name: 'tests', component: () => import('@/views/tests/TestsListView.vue') },
        { path: 'tests/create', name: 'test-create', component: () => import('@/views/tests/CreateTestView.vue'), meta: { roles: STAFF } },
        { path: 'tests/:id', name: 'test-edit', component: () => import('@/views/tests/CreateTestView.vue'), meta: { roles: STAFF } },
        { path: 'tests/:id/take', name: 'take-test', component: () => import('@/views/tests/TakeTestView.vue') },
        { path: 'tests/:id/result', name: 'test-result', component: () => import('@/views/tests/TestResultView.vue') },

        // Tekshirish: fakultet/guruh bo'yicha temperament+psixogeometrik ko'rinishi (staff).
        { path: 'tekshirish', name: 'tekshirish', component: () => import('@/views/tekshirish/TekshirishView.vue'), meta: { roles: STAFF } },
        { path: 'tekshirish/:facultyId/:groupId', name: 'tekshirish-group', component: () => import('@/views/tekshirish/GroupOverviewView.vue'), meta: { roles: STAFF } },

        // Natijalar: staff = kategoriya hub -> instrument picker -> guruh jadvali; student = o'z natijalari.
        { path: 'results', name: 'results', component: () => import('@/views/results/ResultsView.vue') },
        { path: 'results/:instrument', name: 'results-instrument', component: () => import('@/views/results/InstrumentPickerView.vue'), meta: { roles: STAFF } },
        // Sotsiometriya — juftlik asosidagi guruh tahlili, boshqa natijalardan
        // shaklan boshqacha (individual resultKey emas) — o'ziga xos komponent.
        // Static "sotsiometriya" segmenti generic ":instrument"dan oldin turadi.
        { path: 'results/sotsiometriya/:facultyId/:groupId', name: 'results-sociometry-group', component: () => import('@/views/results/SociometryGroupResultsView.vue'), meta: { roles: STAFF } },
        { path: 'results/:instrument/:facultyId/:groupId', name: 'results-instrument-group', component: () => import('@/views/results/InstrumentGroupResultsView.vue'), meta: { roles: STAFF } },

        // Qabul kalendari: xodim (psixolog/admin) boshqaradi; talaba faqat
        // ko'radi (bo'sh/band) — qabulga yozilish uchun murojaat qiladi.
        { path: 'calendar', name: 'calendar', component: () => import('@/views/calendar/CalendarView.vue') },

        // Murojaatlar: talaba yozadi, psixolog/admin javob beradi — hamma uchun.
        { path: 'appeals', name: 'appeals', component: () => import('@/views/appeals/AppealsView.vue') },
        // Bildirishnomadan kelinganda — o'sha murojaatga fokus (#appeal-<id>).
        { path: 'appeals/:id(\\d+)', name: 'appeal-detail', component: () => import('@/views/appeals/AppealsView.vue') },

        // Ijtimoiy-psixologik pasport: talaba to'ldiradi.
        { path: 'passport', name: 'passport', component: () => import('@/views/passport/PassportView.vue'), meta: { roles: ['student'] } },
        // Xodim: fakultet → guruh kesimida talabalar anketalari (ko'rish + PDF).
        { path: 'passports', name: 'passports', component: () => import('@/views/passport/PassportsView.vue'), meta: { roles: STAFF } },
        { path: 'passports/:facultyId/:groupId', name: 'passports-group', component: () => import('@/views/passport/PassportGroupView.vue'), meta: { roles: STAFF } },

        // Tayinlash: staff.
        { path: 'assignments', name: 'assignments', component: () => import('@/views/assignments/AssignmentsView.vue'), meta: { roles: STAFF } },
        { path: 'assignments/create', name: 'assignments-create', component: () => import('@/views/assignments/CreateAssignmentView.vue'), meta: { roles: STAFF } },

        { path: 'statistics', name: 'statistics', component: () => import('@/views/statistics/StatisticsView.vue'), meta: { roles: STAFF } },

        // Admin-only: create faculties / groups / students to test a flow.
        { path: 'admin/organization', name: 'admin-organization', component: () => import('@/views/admin/OrganizationView.vue'), meta: { roles: ADMIN } },

        // Admin-only: approve/reject HEMIS access requests.
        { path: 'admin/access-requests', name: 'admin-access-requests', component: () => import('@/views/admin/AccessRequestsView.vue'), meta: { roles: ADMIN } },

        // Tyutor: faqat o'ziga biriktirilgan guruhlar talabalari + 10-metodika (kuzatuv kartasi).
        { path: 'tutor/students', name: 'tutor-students', component: () => import('@/views/tutor/TutorStudentsView.vue'), meta: { roles: ['tutor'] } },
        { path: 'tutor/students/:id/observation-card', name: 'observation-card-fill', component: () => import('@/views/tutor/ObservationCardFormView.vue'), meta: { roles: ['tutor'] } },

        // Kuzatuv kartalari ro'yxati: psixolog/admin — talaba emas, tyutor emas.
        { path: 'observation-cards', name: 'observation-cards', component: () => import('@/views/observation-cards/ObservationCardsView.vue'), meta: { roles: STAFF } },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // A JWT (HEMIS/impersonation) but no loaded profile yet → resolve it first.
  if (!auth.isAuthenticated && tokenStore.access()) {
    await auth.fetchMe()
  }

  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login' }
  }
  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
  if (to.meta.roles && auth.user && !to.meta.roles.includes(auth.user.role)) {
    return { name: 'dashboard' }
  }
})

export default router
