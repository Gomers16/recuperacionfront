Frontend - Sistema de Gestión de Consolas
Este es el repositorio del frontend para el Sistema de Gestión de Consolas. Es la interfaz de usuario que interactúa con el backend.

Tecnologías Utilizadas
Vue.js: Framework para la interfaz de usuario.
TypeScript: Lenguaje de programación.
Vite: Herramienta de construcción rápida.
Requisitos Previos
Node.js (v18+ recomendado)
npm
Configuración y Ejecución
Sigue estos pasos para poner el frontend en marcha:

Clonar el Repositorio:

Bash

git clone <URL_DEL_REPOSITORIO_FRONTEND> frontend-consolas
cd frontend-consolas
Instalar Dependencias:

Bash

npm install
Configurar la URL de la API:
Abre el archivo src/services/ConsoleService.ts y asegúrate de que la API_URL apunte a tu backend:

TypeScript

// src/services/ConsoleService.ts
const API_URL = 'http://localhost:3333/api/consoles'; // Asegúrate que esta sea la URL de tu backend
Iniciar el Servidor de Desarrollo:

Bash

npm run dev
El frontend se abrirá en tu navegador (normalmente http://localhost:5173 o un puerto similar).
