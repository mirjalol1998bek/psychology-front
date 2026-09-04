import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/types/domain'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    roles?: UserRole[]
  }
}

const STAFF: UserRole[] = ['psychologist', 'admin']

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
      path: '/',
      component: () => import('@/layouts/DefaultLayout.vue'),
      children: [
        { path: '', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },

        // Testlar: staff = management list/builder, student = take-test cards.
        { path: 'tests', name: 'tests', component: () => import('@/views/tests/TestsListView.vue') },
        { path: 'tests/create', name: 'test-create', component: () => import('@/views/tests/CreateTestView.vue'), meta: { roles: STAFF } },
        { path: 'tests/:id', name: 'test-edit', component: () => import('@/views/tests/CreateTestView.vue'), meta: { roles: STAFF } },
        { path: 'tests/:id/take', name: 'take-test', component: () => import('@/views/tests/TakeTestView.vue') },

        // Tekshirish: fakultet/guruh bo'yicha temperament+psixogeometrik ko'rinishi (staff).
        { path: 'tekshirish', name: 'tekshirish', component: () => import('@/views/tekshirish/TekshirishView.vue'), meta: { roles: STAFF } },
        { path: 'tekshirish/:facultyId/:groupId', name: 'tekshirish-group', component: () => import('@/views/tekshirish/GroupOverviewView.vue'), meta: { roles: STAFF } },

        // Natijalar: staff = kategoriya hub -> instrument picker -> guruh jadvali; student = o'z natijalari.
        { path: 'results', name: 'results', component: () => import('@/views/results/ResultsView.vue') },
        { path: 'results/:instrument', name: 'results-instrument', component: () => import('@/views/results/InstrumentPickerView.vue'), meta: { roles: STAFF } },
        { path: 'results/:instrument/:facultyId/:groupId', name: 'results-instrument-group', component: () => import('@/views/results/InstrumentGroupResultsView.vue'), meta: { roles: STAFF } },

        { path: 'calendar', name: 'calendar', component: () => import('@/views/calendar/CalendarView.vue') },

        // Tayinlash: staff.
        { path: 'assignments', name: 'assignments', component: () => import('@/views/assignments/AssignmentsView.vue'), meta: { roles: STAFF } },
        { path: 'assignments/create', name: 'assignments-create', component: () => import('@/views/assignments/CreateAssignmentView.vue'), meta: { roles: STAFF } },

        { path: 'statistics', name: 'statistics', component: () => import('@/views/statistics/StatisticsView.vue'), meta: { roles: STAFF } },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

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
