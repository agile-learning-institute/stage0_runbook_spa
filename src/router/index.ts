import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/runbooks'
    },
    {
      path: '/runbooks',
      name: 'Runbooks',
      component: () => import('@/pages/RunbooksListPage.vue')
    },
    {
      path: '/runbook/:filename',
      name: 'RunbookViewer',
      component: () => import('@/pages/RunbookViewerPage.vue'),
      props: true
    }
  ]
})

export default router

