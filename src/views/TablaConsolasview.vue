<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import ConsoleService from '../services/ConsoleService'; // Asegúrate que la ruta sea correcta
import type { ConsoleData, PaginatedResponse, CreateConsolePayload, UpdateConsolePayload } from '../services/ConsoleService'; 

// --- Variables de estado ---
const consoles = ref<ConsoleData[]>([]);
const isLoading = ref<boolean>(true);
const hasError = ref<string | null>(null);

const currentPage = ref<number>(1);
const itemsPerPage = ref<number>(10);
const totalItems = ref<number>(0);
const totalPages = ref<number>(1);
const includeInactive = ref<boolean>(false);

// Control de modales
const isEditModalOpen = ref<boolean>(false);
const isDetailsModalOpen = ref<boolean>(false);
const selectedConsole = ref<ConsoleData | null>(null);

// Formulario para CREAR una nueva consola (directamente en la parte superior de la vista)
const newConsoleForm = ref<CreateConsolePayload>({
  name: '',
  manufacturer: '',
  serialNumber: '',
});

// Formulario para EDITAR una consola (en un modal)
const editConsoleForm = ref<Partial<ConsoleData>>({
  name: '',
  manufacturer: '',
  serialNumber: '',
  is_active: true, // Por defecto, una consola a editar es activa
});


// --- Propiedades computadas ---
const canGoToPreviousPage = computed(() => currentPage.value > 1);
const canGoToNextPage = computed(() => currentPage.value < totalPages.value);
const hasConsoles = computed(() => consoles.value.length > 0);

// Validez del formulario de CREACIÓN
const isNewFormValid = computed(() => {
  return !!newConsoleForm.value.name && !!newConsoleForm.value.manufacturer && !!newConsoleForm.value.serialNumber;
});

// Validez del formulario de EDICIÓN
const isEditFormValid = computed(() => {
  return !!editConsoleForm.value.name && !!editConsoleForm.value.manufacturer && !!editConsoleForm.value.serialNumber;
});

// Propiedad computada para generar el rango de páginas a mostrar
const pagesToShow = computed(() => {
  const pages: number[] = [];
  const maxPages = 5; // Número máximo de botones de página a mostrar (ej. 1 2 3 4 5)
  let startPage: number, endPage: number;

  if (totalPages.value <= maxPages) {
    // Si hay menos páginas que el máximo a mostrar, mostrar todas
    startPage = 1;
    endPage = totalPages.value;
  } else {
    // Calcular el inicio y fin para centrar la página actual
    startPage = Math.max(1, currentPage.value - Math.floor(maxPages / 2));
    endPage = Math.min(totalPages.value, startPage + maxPages - 1);

    // Ajustar si el rango no cubre el `maxPages` completo
    if (endPage - startPage + 1 < maxPages) {
      if (startPage === 1) { // Si estamos al principio, extender el final
        endPage = Math.min(totalPages.value, maxPages);
      } else if (endPage === totalPages.value) { // Si estamos al final, extender el inicio
        startPage = Math.max(1, totalPages.value - maxPages + 1);
      }
    }
  }

  // --- DEBUGGING: console.log para ver las páginas que se generarán ---
  // console.log(`[pagesToShow] currentPage: ${currentPage.value}, totalPages: ${totalPages.value}, startPage: ${startPage}, endPage: ${endPage}`);
  // console.log(`[pagesToShow] pages generadas: ${pages}`);

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  return pages;
});


// --- Funciones de Fetching y Paginación ---
async function fetchConsoles(): Promise<void> {
  isLoading.value = true;
  hasError.value = null;
  consoles.value = [];

  try {
    const response: PaginatedResponse<ConsoleData> = await ConsoleService.getConsoles(
      currentPage.value,
      itemsPerPage.value,
      includeInactive.value
    );
    consoles.value = response.consoles;
    totalItems.value = response.meta.total;
    totalPages.value = response.meta.last_page;

    // --- DEBUGGING: console.log para verificar la respuesta de la API y los valores actualizados ---
    console.log('--- fetchConsoles: Datos recibidos y actualizados ---');
    console.log('Respuesta completa de la API:', response);
    console.log('consoles.length:', consoles.value.length);
    console.log('totalItems.value (desde meta.total):', totalItems.value);
    console.log('totalPages.value (desde meta.last_page):', totalPages.value);
    console.log('currentPage.value (después de fetch):', currentPage.value);
    console.log('canGoToPreviousPage.value:', canGoToPreviousPage.value);
    console.log('canGoToNextPage.value:', canGoToNextPage.value);
    console.log('pagesToShow.value (calculado):', pagesToShow.value);
    console.log('----------------------------------------------------');

  } catch (err: any) {
    hasError.value = err.message || 'Error desconocido al cargar consolas.';
    console.error('Error al obtener consolas:', err);
    // --- DEBUGGING: console.log para errores ---
    console.log('Error en fetchConsoles:', err);
  } finally {
    isLoading.value = false;
  }
}

function goToPage(pageNumber: number): void {
  // --- DEBUGGING: console.log al intentar ir a una página ---
  console.log(`Intentando ir a la página: ${pageNumber}`);
  console.log(`Condiciones: pageNumber >= 1 (${pageNumber >= 1}), pageNumber <= totalPages.value (${pageNumber <= totalPages.value}), pageNumber !== currentPage.value (${pageNumber !== currentPage.value})`);

  if (pageNumber >= 1 && pageNumber <= totalPages.value && pageNumber !== currentPage.value) {
    currentPage.value = pageNumber;
    fetchConsoles();
    // --- DEBUGGING: console.log después de cambiar la página ---
    console.log(`currentPage.value cambiado a: ${currentPage.value}`);
  } else {
    console.log('No se pudo cambiar de página: Las condiciones no se cumplen.');
  }
}

// --- Funciones de Modales (para Editar y Ver Detalles) ---
function openEditModal(consoleItem: ConsoleData): void {
  selectedConsole.value = consoleItem;
  // Pre-rellena el formulario de edición con los datos de la consola seleccionada
  editConsoleForm.value = { 
    id: consoleItem.id, // Asegurarse de mantener el ID para la actualización
    name: consoleItem.name,
    manufacturer: consoleItem.manufacturer,
    serialNumber: consoleItem.serialNumber,
    is_active: consoleItem.is_active 
  };
  isEditModalOpen.value = true;
}

function openDetailsModal(consoleItem: ConsoleData): void {
  selectedConsole.value = consoleItem;
  isDetailsModalOpen.value = true;
}

function closeModal(): void {
  isEditModalOpen.value = false;
  isDetailsModalOpen.value = false;
  selectedConsole.value = null;
  // Limpiar el formulario de edición. No limpiar newConsoleForm aquí.
  editConsoleForm.value = { name: '', manufacturer: '', serialNumber: '', is_active: true }; 
  fetchConsoles(); // Refrescar la tabla después de cerrar un modal para reflejar cambios
}

// --- Funciones de Acción (CRUD) ---
async function handleCreateConsole(): Promise<void> {
  if (!isNewFormValid.value) {
    alert('Por favor, rellena todos los campos obligatorios (Nombre, Fabricante, Número de Serie) para crear una consola.');
    return;
  }

  try {
    isLoading.value = true;
    await ConsoleService.createConsole(newConsoleForm.value); // Ya es del tipo correcto CreateConsolePayload
    alert('Consola creada exitosamente.');
    // Limpia el formulario después de crear
    newConsoleForm.value = { name: '', manufacturer: '', serialNumber: '' };
    currentPage.value = 1; // Volver a la primera página para ver la nueva consola
    fetchConsoles(); // Refresca la tabla para mostrar la nueva consola
  } catch (err: any) {
    alert(`Error al crear la consola: ${err.message}`);
    console.error('Error al crear consola:', err);
  } finally {
    isLoading.value = false;
  }
}

async function handleUpdateConsole(): Promise<void> {
  if (!selectedConsole.value?.id || !isEditFormValid.value) { // Asegurarse de que el ID exista
    alert('Error: Consola no seleccionada o campos incompletos.');
    return;
  }
  
  try {
    isLoading.value = true;
    // Solo envía los campos que se pueden actualizar.
    // TypeScript ya valida que editConsoleForm es Partial<ConsoleData>, que es compatible con UpdateConsolePayload.
    await ConsoleService.updateConsole(selectedConsole.value.id, editConsoleForm.value);
    alert(`Consola "${selectedConsole.value.name}" actualizada exitosamente.`);
    closeModal(); // Cierra el modal y refresca la tabla
  } catch (err: any) {
    alert(`Error al actualizar la consola: ${err.message}`);
    console.error('Error al actualizar consola:', err);
  } finally {
    isLoading.value = false;
  }
}

async function handleDeactivate(consoleItem: ConsoleData): Promise<void> {
  if (!confirm(`¿Estás seguro de que quieres inactivar la consola "${consoleItem.name}"?`)) {
    return;
  }
  try {
    isLoading.value = true;
    // Pasa el ID directamente, ya que el servicio lo espera
    await ConsoleService.deactivateConsole(consoleItem.id!); // El '!' asume que id no será null
    alert(`Consola "${consoleItem.name}" inactivada exitosamente.`);
    await fetchConsoles(); // Refresca la tabla para ver el cambio de estado
  } catch (err: any) {
    alert(`Error al inactivar la consola: ${err.message}`);
    console.error('Error al inactivar consola:', err);
  } finally {
    isLoading.value = false;
  }
}

// --- Watchers y OnMounted ---
// Cada vez que cambie `includeInactive` o `itemsPerPage`, volvemos a la primera página y recargamos.
watch([includeInactive, itemsPerPage], () => {
  currentPage.value = 1;
  fetchConsoles();
});

// Carga las consolas al montar el componente
onMounted(() => {
  fetchConsoles();
});
</script>

<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1>Gestión de Consolas</h1>
    </header>

    <div class="creation-form-section">
      <h2>Crear Nueva Consola</h2>
      <form @submit.prevent="handleCreateConsole" class="create-console-form">
        <div class="form-grid">
          <div class="form-group">
            <label for="new-name">Nombre:</label>
            <input type="text" id="new-name" v-model="newConsoleForm.name" required />
          </div>
          <div class="form-group">
            <label for="new-manufacturer">Fabricante:</label>
            <input type="text" id="new-manufacturer" v-model="newConsoleForm.manufacturer" required />
          </div>
          <div class="form-group">
            <label for="new-serialNumber">Número de Serie:</label>
            <input type="text" id="new-serialNumber" v-model="newConsoleForm.serialNumber" required />
          </div>
          <div class="form-action-group">
            <button type="submit" class="btn btn-create-inline" :disabled="!isNewFormValid">
              <i class="icon-plus"></i> Crear Consola
            </button>
          </div>
        </div>
      </form>
    </div>

    <div class="filters-bar">
      <label class="filter-checkbox">
        <input type="checkbox" v-model="includeInactive" />
        Mostrar Consolas Inactivas
      </label>
      <div class="pagination-limit-select">
        <label for="items-per-page">Mostrar:</label>
        <select id="items-per-page" v-model.number="itemsPerPage">
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
        </select>
        <span>items</span>
      </div>
    </div>

    <div v-if="isLoading" class="status-message loading">
      <div class="spinner"></div>
      <p>Cargando consolas, por favor espera...</p>
    </div>

    <div v-else-if="hasError" class="status-message error">
      <p><strong>¡Error al cargar las consolas!</strong></p>
      <p>{{ hasError }}</p>
      <button class="btn btn-retry" @click="fetchConsoles()">Reintentar Carga</button>
    </div>

    <div v-else-if="!hasConsoles" class="status-message no-data">
      <p>No se encontraron consolas.</p>
    </div>

    <div v-else class="table-section">
      <div class="table-responsive">
        <table class="consoles-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Fabricante</th>
              <th>Número de Serie</th>
              <th>Estado</th>
              <th>Fecha Creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="consoleItem in consoles" :key="consoleItem.id">
              <td>{{ consoleItem.name }}</td>
              <td>{{ consoleItem.manufacturer }}</td>
              <td>{{ consoleItem.serialNumber }}</td>
              <td>
                <span :class="['status-badge', { 'is-active': consoleItem.is_active, 'is-inactive': !consoleItem.is_active }]">
                  {{ consoleItem.is_active ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td>{{ consoleItem.createdAt ? new Date(consoleItem.createdAt).toLocaleDateString('es-CO') : 'N/A' }}</td> 
              <td class="actions-cell">
                <button class="btn btn-action view" @click="openDetailsModal(consoleItem)">Ver</button>
                <button class="btn btn-action edit" @click="openEditModal(consoleItem)">Editar</button>
                <button
                  v-if="consoleItem.is_active"
                  class="btn btn-action deactivate"
                  @click="handleDeactivate(consoleItem)"
                >
                  Inactivar
                </button>
                </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination-footer">
        <span class="pagination-summary">
          Mostrando {{ consoles.length }} de {{ totalItems }} consolas
          (Página {{ currentPage }} de {{ totalPages }})
        </span>
        <div class="pagination-controls">
          <button
            class="btn btn-pagination"
            @click="goToPage(1)"
            :disabled="currentPage === 1"
          >
            Primera
          </button>
          <button
            class="btn btn-pagination"
            @click="goToPage(currentPage - 1)"
            :disabled="!canGoToPreviousPage"
          >
            Anterior
          </button>
          
          <template v-for="page in pagesToShow" :key="page">
            <button
              class="btn btn-pagination page-number"
              @click="goToPage(page)"
              :class="{ 'active-page': page === currentPage }"
            >
              {{ page }}
            </button>
          </template>

          <button
            class="btn btn-pagination"
            @click="goToPage(currentPage + 1)"
            :disabled="!canGoToNextPage"
          >
            Siguiente
          </button>
          <button
            class="btn btn-pagination"
            @click="goToPage(totalPages)"
            :disabled="currentPage === totalPages"
          >
            Última
          </button>
        </div>
      </div>
    </div>

    <div v-if="isEditModalOpen && selectedConsole" class="modal-overlay">
      <div class="modal-content">
        <h2>Editar Consola: {{ selectedConsole.name }}</h2>
        <form @submit.prevent="handleUpdateConsole">
          <div class="form-group">
            <label for="edit-name">Nombre:</label>
            <input type="text" id="edit-name" v-model="editConsoleForm.name" required />
          </div>
          <div class="form-group">
            <label for="edit-manufacturer">Fabricante:</label>
            <input type="text" id="edit-manufacturer" v-model="editConsoleForm.manufacturer" required />
          </div>
          <div class="form-group">
            <label for="edit-serialNumber">Número de Serie:</label>
            <input type="text" id="edit-serialNumber" v-model="editConsoleForm.serialNumber" required />
          </div>
          <div class="form-group">
            <label for="edit-status">Estado:</label>
            <select id="edit-status" v-model="editConsoleForm.is_active">
              <option :value="true">Activa</option>
              <option :value="false">Inactiva</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary" :disabled="!isEditFormValid">Actualizar</button>
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="isDetailsModalOpen && selectedConsole" class="modal-overlay">
      <div class="modal-content">
        <h2>Detalles de Consola: {{ selectedConsole.name }}</h2>
        <div class="details-group">
          <strong>ID:</strong> <span>{{ selectedConsole.id }}</span>
        </div>
        <div class="details-group">
          <strong>Nombre:</strong> <span>{{ selectedConsole.name }}</span>
        </div>
        <div class="details-group">
          <strong>Fabricante:</strong> <span>{{ selectedConsole.manufacturer }}</span>
        </div>
        <div class="details-group">
          <strong>Número de Serie:</strong> <span>{{ selectedConsole.serialNumber }}</span>
        </div>
        <div class="details-group">
          <strong>Estado:</strong> 
          <span :class="['status-badge', { 'is-active': selectedConsole.is_active, 'is-inactive': !selectedConsole.is_active }]">
            {{ selectedConsole.is_active ? 'Activa' : 'Inactiva' }}
          </span>
        </div>
        <div class="details-group">
          <strong>Creada en:</strong> <span>{{ selectedConsole.createdAt ? new Date(selectedConsole.createdAt).toLocaleString('es-CO') : 'N/A' }}</span>
        </div>
        <div class="details-group">
          <strong>Actualizada en:</strong> <span>{{ selectedConsole.updatedAt ? new Date(selectedConsole.updatedAt).toLocaleString('es-CO') : 'N/A' }}</span>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" @click="closeModal">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Variables de color (Puedes mantenerlas en un archivo de variables global si usas un preprocesador) */
:root {
  --primary-color: #007bff;
  --primary-hover-color: #0056b3;
  --success-color: #28a745;
  --success-hover-color: #218838;
  --danger-color: #dc3545; 
  --danger-hover-color: #c82333; 
  --info-color: #17a2b8;
  --info-hover-color: #138496;
  --secondary-color: #6c757d;
  --secondary-hover-color: #5a6268;
  --light-bg: #f8f9fa;
  --dark-text: #343a40;
  --border-color: #dee2e6;
  --card-bg: #ffffff;
  --shadow-light: rgba(0, 0, 0, 0.1);

  /* Colores para los botones de acción */
  --action-view-background-color: var(--info-color); /* Azul claro */
  --action-view-hover-background-color: var(--info-hover-color);
  --action-edit-background-color: var(--primary-color); /* Azul */
  --action-edit-hover-background-color: var(--primary-hover-color);
  --action-deactivate-background-color: var(--danger-color); /* Rojo */
  --action-deactivate-hover-background-color: var(--danger-hover-color);
  --action-activate-background-color: var(--success-color); /* Verde */
  --action-activate-hover-background-color: var(--success-hover-color);

  --action-button-text-color: white; /* Color de letra blanco para visibilidad */
}

/* Base del contenedor */
.dashboard-container {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 1200px;
  margin: 30px auto;
  padding: 25px;
  background-color: var(--light-bg);
  border-radius: 10px;
  box-shadow: 0 4px 20px var(--shadow-light);
  color: var(--dark-text);
}

/* Encabezado */
.dashboard-header {
  display: flex;
  justify-content: center; /* Centrado */
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid var(--border-color);
}

.dashboard-header h1 {
  margin: 0;
  font-size: 2.2em;
  color: var(--dark-text);
  font-weight: 600;
  text-align: center;
}

/* Sección de Creación de Consola (Nuevo) */
.creation-form-section {
  background-color: var(--card-bg);
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
}

.creation-form-section h2 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.6em;
  color: var(--dark-text);
  text-align: center;
}

.create-console-form {
  display: flex;
  flex-direction: column; /* Por defecto apilado */
  gap: 15px; /* Espacio entre grupos */
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* 3 columnas en pantallas grandes */
  gap: 20px;
  align-items: end; /* Alinea los botones al final */
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
  font-size: 0.95em;
}

.form-group input[type="text"] {
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 1em;
  box-sizing: border-box;
}

.form-group input[type="text"]:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
}

.form-action-group {
  display: flex;
  justify-content: flex-end; /* Alinea el botón a la derecha */
  align-items: flex-end; /* Asegura que se alinee con los labels de los inputs */
  padding-top: 10px; /* Para alinear con los labels de los inputs */
}

.btn-create-inline {
  background-color: var(--success-color); /* Verde para crear */
  color: white;
  padding: 12px 25px;
  font-size: 1em;
  border-radius: 7px;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 150px;
  justify-content: center;
}

.btn-create-inline:hover {
  background-color: var(--success-hover-color);
}

/* El resto de los estilos son iguales a los anteriores */

/* Barra de filtros */
.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--card-bg);
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 25px;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95em;
  color: var(--dark-text);
}

.filter-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--primary-color);
}

.pagination-limit-select {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95em;
  color: var(--dark-text);
}

.pagination-limit-select select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: white;
  font-size: 0.9em;
  cursor: pointer;
}

/* Mensajes de estado (carga, error, sin datos) */
.status-message {
  padding: 25px;
  text-align: center;
  border-radius: 8px;
  margin-bottom: 25px;
  font-size: 1.1em;
}

.status-message.loading {
  background-color: #e0f7fa;
  color: #00796b;
  border: 1px solid #b2ebf2;
}

.status-message.error {
  background-color: #ffebee;
  color: #d32f2f;
  border: 1px solid #ef9a9a;
}

.status-message.no-data {
  background-color: #fffde7;
  color: #fbc02d;
  border: 1px solid #fff59d;
}

.status-message .spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.status-message .btn-retry {
  background-color: var(--danger-color);
  color: white;
  margin-top: 15px;
}
.status-message .btn-retry:hover {
  background-color: var(--danger-hover-color);
}
.status-message .btn-secondary {
  background-color: var(--secondary-color);
  color: white;
  margin-top: 15px;
}
.status-message .btn-secondary:hover {
  background-color: var(--secondary-hover-color);
}

/* Sección de la tabla */
.table-section {
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.table-responsive {
  overflow-x: auto;
}

.consoles-table {
  width: 100%;
  border-collapse: collapse;
}

.consoles-table th,
.consoles-table td {
  padding: 15px 20px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.consoles-table th {
  background-color: var(--light-bg);
  color: var(--dark-text);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.85em;
}

.consoles-table tbody tr:last-child td {
  border-bottom: none;
}

.consoles-table tbody tr:hover {
  background-color: #f2f7fd;
}

/* Badges de estado - Letra negra o blanca según el fondo */
.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75em;
  font-weight: 700;
  color: white; /* Color de letra por defecto para los badges */
  display: inline-block;
}

.status-badge.is-active {
  background-color: var(--success-color); /* Verde */
}

.status-badge.is-inactive {
  background-color: var(--secondary-color); /* Gris */
  /* Si el gris es muy claro y necesitas la letra negra, puedes sobrescribir: */
  /* color: black; */ 
}

/* Celda de acciones */
.actions-cell {
  white-space: nowrap;
}

.btn {
  padding: 8px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s ease, transform 0.1s ease;
  min-width: 80px;
  color: var(--action-button-text-color); /* Color de texto blanco para todos los botones de acción */
}

.btn:hover {
  transform: translateY(-1px);
}
.btn:active {
  transform: translateY(0);
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ESTILOS PARA LOS BOTONES DE ACCIÓN INDIVIDUALES */
.btn-action {
  margin-right: 8px; /* Espacio entre botones de acción */
}

.btn-action.view {
  background-color: var(--action-view-background-color);
}
.btn-action.view:hover {
  background-color: var(--action-view-hover-background-color);
}

.btn-action.edit {
  background-color: var(--action-edit-background-color);
}
.btn-action.edit:hover {
  background-color: var(--action-edit-hover-background-color);
}

.btn-action.deactivate {
  background-color: var(--action-deactivate-background-color);
}
.btn-action.deactivate:hover {
  background-color: var(--action-deactivate-hover-background-color);
}

.btn-action.reactivate { 
  background-color: var(--action-activate-background-color);
}
.btn-action.reactivate:hover {
  background-color: var(--action-activate-hover-background-color);
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}
.btn-primary:hover {
  background-color: var(--primary-hover-color);
}
.btn-secondary { /* Estilo para el botón de cancelar en modales */
  background-color: var(--secondary-color);
  color: white;
}
.btn-secondary:hover {
  background-color: var(--secondary-hover-color);
}

/* Pie de paginación */
.pagination-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-top: 1px solid var(--border-color);
  background-color: var(--light-bg);
  flex-wrap: wrap; /* Permite que los elementos se envuelvan */
  gap: 15px; /* Espacio entre los elementos al envolver */
}

.pagination-summary {
  font-size: 0.9em;
  color: #555;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 5px; /* Reducido para los números de página */
  flex-wrap: wrap; /* Permite que los botones se envuelvan */
  justify-content: center; /* Centra los botones cuando se envuelven */
}

.btn-pagination {
  background-color: var(--primary-color);
  color: white;
  padding: 8px 15px;
  border-radius: 5px;
  font-size: 0.9em; /* Ajuste el tamaño para los botones de paginación */
}

.btn-pagination.page-number {
  background-color: var(--secondary-color); /* Color diferente para los números */
  color: white;
}
.btn-pagination.page-number:hover {
  background-color: var(--secondary-hover-color);
}

.btn-pagination.active-page {
  background-color: var(--primary-color); /* Resaltar la página activa */
  color: white;
  font-weight: bold;
  border: 1px solid var(--primary-hover-color);
}


.btn-pagination:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  opacity: 0.7;
}

/* Removido el .page-indicator ya que cada número tendrá su propio botón */
/* .page-indicator {
  font-weight: 600;
  padding: 0 8px;
} */

/* --- ESTILOS DE MODAL --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--card-bg);
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
  animation: modal-fade-in 0.3s ease-out;
}

@keyframes modal-fade-in {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 25px;
  color: var(--dark-text);
  font-size: 1.8em;
  text-align: center;
}

/* Formulario dentro del modal */
.modal-content .form-group label {
  font-size: 1em; /* Un poco más grande para los modales */
}
.modal-content .form-group input[type="text"],
.modal-content .form-group select {
  padding: 10px; /* Ajuste el padding para los inputs del modal */
}


.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
}

.modal-actions .btn {
  padding: 10px 20px;
  font-size: 1em;
}

.details-group {
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px dotted var(--border-color);
}

.details-group:last-child {
  border-bottom: none;
}

.details-group strong {
  display: inline-block;
  min-width: 120px; /* Para alinear los valores */
  color: var(--dark-text);
}


/* Responsive Design */
@media (max-width: 768px) {
  .dashboard-container {
    margin: 15px;
    padding: 15px;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }
  .dashboard-header h1 {
    font-size: 1.8em;
  }

  .creation-form-section h2 {
    font-size: 1.4em;
  }
  .form-grid {
    grid-template-columns: 1fr; /* Una columna en pantallas pequeñas */
  }
  .form-action-group {
    justify-content: center; /* Centra el botón en móviles */
  }
  .btn-create-inline {
    width: 100%;
  }

  .filters-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .consoles-table th,
  .consoles-table td {
    padding: 10px 12px;
    font-size: 0.85em;
  }

  .actions-cell {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    justify-content: flex-start;
  }
  .btn-action {
    margin-right: 0;
    flex: 1 1 auto;
    min-width: unset;
  }

  .pagination-footer {
    flex-direction: column;
    gap: 15px;
    align-items: center;
  }
  .pagination-controls {
    flex-wrap: wrap;
    justify-content: center;
  }

  .modal-content {
    padding: 20px;
  }
  .modal-content h2 {
    font-size: 1.5em;
  }
  .modal-actions {
    flex-direction: column;
    gap: 10px;
  }
  .modal-actions .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .consoles-table th,
  .consoles-table td {
    padding: 8px;
    font-size: 0.8em;
  }
}
</style>