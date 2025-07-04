// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 💅 Estilos globales (si los tienes)
import './assets/main.css'

// 🔌 Vuetify completo sin archivos externos
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
})

createApp(App)
  .use(router)
  .use(vuetify)
  .mount('#app')
