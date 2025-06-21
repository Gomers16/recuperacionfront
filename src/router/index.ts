import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Tablaview from '@/views/Tablaview.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Tabla', component: Tablaview }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
