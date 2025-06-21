🖥️ Frontend - Sistema de Gestión de Consolas
Este es el repositorio del frontend para el Sistema de Gestión de Consolas. Es la interfaz de usuario que interactúa con el backend desarrollado en AdonisJS.

🚀 Tecnologías Utilizadas
Vue.js 3: Framework progresivo para construir interfaces de usuario.

TypeScript: Lenguaje de programación tipado.

Vite: Herramienta de construcción moderna y rápida para Vue.

Vue Router: Manejo de rutas para aplicaciones Vue.

Vuetify: Framework de componentes UI basado en Material Design para Vue 3.

✅ Requisitos Previos
Antes de comenzar, asegúrate de tener instalado:

Node.js (v18 o superior recomendado)
👉 https://nodejs.org

npm (v9 o superior, usualmente incluido con Node.js)

⚙️ Instalación y Configuración

1️⃣ Clonar el Repositorio
bash
-git clone <URL_DEL_REPOSITORIO_FRONTEND> frontend-consolas

-cd frontend-consolas

2️⃣ Instalar Dependencias del Proyecto
bash
-npm install
Esto instalará todas las dependencias necesarias, incluyendo:

vite

vue

vue-router

vuetify

typescript

sass

@mdi/font

3️⃣ Instalar y Configurar Vuetify
📦 Instalar Vuetify y sus dependencias
bash

-npm install vuetify@next sass @mdi/font
🧩 Crear archivo de configuración vuetify.ts
ts

// src/vuetify.ts
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export default createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'light',
  },
})


⚙️ Usar Vuetify en main.ts
ts

// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Vuetify
import vuetify from './vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Estilos globales
import './assets/main.css'

createApp(App).use(router).use(vuetify).mount('#app')
4️⃣ Configurar la URL de la API
Edita el archivo src/services/ConsoleService.ts y asegúrate de que la constante API_URL apunte correctamente a tu backend:

ts

// src/services/ConsoleService.ts
const API_URL = 'http://localhost:3333/api/consoles';
🧪 Ejecutar el Proyecto en Desarrollo
bash

-npm run dev
El proyecto se abrirá automáticamente en tu navegador, usualmente en:

http://localhost:5173











