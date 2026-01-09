import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/runbooks'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/pages/DevLoginPage.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/runbooks',
      name: 'Runbooks',
      component: () => import('@/pages/RunbooksListPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/runbook/:filename',
      name: 'RunbookViewer',
      component: () => import('@/pages/RunbookViewerPage.vue'),
      props: true,
      meta: { requiresAuth: true }
    }
  ]
})

// Navigation guard to protect authenticated routes
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  
  // If route requires authentication and user is not authenticated, redirect to login
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  }
  // If user is authenticated and tries to access login page, redirect to runbooks
  else if (to.name === 'Login' && authStore.isAuthenticated) {
    next({ name: 'Runbooks' })
  }
  else {
    next()
  }
})

export default router

