/**
 * Vue Router 配置
 * Feature: 004-algorithm-selection
 */

import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'FlowEditor',
    component: () => import('@/views/FlowEditor.vue'),
    meta: {
      title: '隐私计算任务流'
    }
  },
  {
    path: '/algorithm-manager',
    name: 'AlgorithmManager',
    component: () => import('@/views/AlgorithmManager.vue'),
    meta: {
      title: '算法管理'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：更新页面标题
router.beforeEach((to, _from, next) => {
  document.title = (to.meta.title as string) || '隐私计算平台'
  next()
})

export default router
