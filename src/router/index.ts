import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
// Asegúrate de que el nombre del archivo y la extensión coincidan exactamente
import TablaConsolasview from '@/views/TablaConsolasview.vue' 

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Tabla', component: TablaConsolasview }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router