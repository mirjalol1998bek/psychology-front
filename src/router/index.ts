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
        { path: 'tests', name: 'tests', component: () => import('@/views/tests/TestsListView.vue') },
        { path: 'tests/:id', name: 'take-test', component: () => import('@/views/tests/TakeTestView.vue') },
        { path: 'results', name: 'results', component: () => import('@/views/results/ResultsView.vue') },
        { path: 'calendar', name: 'calendar', component: () => import('@/views/calendar/CalendarView.vue') },
        {
          path: 'assignments',
          name: 'assignments',
          component: () => import('@/views/assignments/AssignmentsView.vue'),
          meta: { roles: STAFF },
        },
        {
          path: 'statistics',
          name: 'statistics',
          component: () => import('@/views/statistics/StatisticsView.vue'),
          meta: { roles: STAFF },
        },
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
