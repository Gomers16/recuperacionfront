<template>
  <v-container fluid class="py-5">
    <v-card class="mb-5" outlined>
      <v-card-title class="text-h5 text-center">Gestión de Consolas</v-card-title>
      <v-card-text>
        <v-alert
          v-if="showFormAlert"
          type="warning"
          variant="tonal"
          class="mb-4"
          closable
          v-model="showFormAlert"
        >
          {{ formAlertMessage }}
        </v-alert>

        <v-form ref="form" @submit.prevent="submitForm" class="form" style="color: black">
          <v-row>
            <v-col cols="12">
              <v-text-field
                label="Nombre de la Consola"
                v-model="nombre"
                required
                outlined
                clearable
                :error-messages="validationErrors.name"
                :rules="[rules.required, rules.minLength, rules.maxLength, validateNombreConsolaUnico]" />
            </v-col>
            <v-col cols="12">
              <v-text-field
                label="Fabricante"
                v-model="fabricante"
                outlined
                required
                clearable
                :error-messages="validationErrors.manufacturer"
                :rules="[rules.required, rules.minLength, rules.maxLength]"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                label="Número de Serie"
                v-model="serialNumber"
                outlined
                required
                counter
                clearable
                maxlength="255"
                hint="Proporciona el número de serie único de la consola."
                :error-messages="validationErrors.serialNumber"
                :rules="[rules.required, rules.descriptionMaxLength, validateNumeroSerieUnico]"
              />
            </v-col>
            <v-col cols="12" v-if="isEditing">
              <v-select
                label="Estado de la Consola"
                v-model="is_active"
                :items="[{ title: 'Activa', value: true }, { title: 'Inactiva', value: false }]"
                outlined
                required
                :error-messages="validationErrors.is_active"
                :rules="[rules.is_activeRequired]"
              ></v-select>
            </v-col>
          </v-row>

          <div class="d-flex justify-start">
            <v-btn v-if="isEditing" color="secondary" @click="resetForm" class="mr-2">Cancelar Edición</v-btn>
            <v-btn v-if="!isEditing" color="grey" text @click="resetForm" class="mr-2">Limpiar Formulario</v-btn>
            <v-btn color="primary" type="submit">{{ isEditing ? 'Actualizar Consola' : 'Crear Consola' }}</v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <v-card outlined>
      <v-card-title class="text-h6">Listado de Consolas</v-card-title>
      <v-row align="center" class="px-4 pb-4">
        <v-col cols="12" sm="6" md="4" lg="3">
          <v-text-field v-model="search" label="Buscar consola" prepend-inner-icon="mdi-magnify" outlined dense hide-details />
        </v-col>
        <v-col cols="12" sm="6" md="4" lg="3">
          <v-select
            v-model="filtroEstadoTabla"
            :items="[{ title: 'Activas', value: true }, { title: 'Inactivas', value: false }, { title: 'Todas', value: 'todos' }]"
            label="Filtrar por Estado"
            outlined
            dense
            hide-details
          ></v-select>
        </v-col>
        <v-col cols="12" sm="6" md="4" lg="6" class="d-flex justify-start">
          <v-btn-toggle v-model="sortBy[0].order" mandatory variant="elevated" color="primary">
            <v-btn value="asc" class="pa-2">
              <v-icon>mdi-sort-ascending</v-icon>
            </v-btn>
            <v-btn value="desc" class="pa-2">
              <v-icon>mdi-sort-descending</v-icon>
            </v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>

      <v-data-table
        :headers="headers"
        :items="filteredConsoles" item-value="id"
        v-model:sort-by="sortBy"
        class="elevation-1"
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center">
            <v-icon :color="item.is_active ? 'primary' : 'grey'" class="mr-2">{{ getConsoleIcon(item.manufacturer) }}</v-icon>
            <span>{{ item.name }}</span>
          </div>
        </template>

        <template v-slot:item.is_active="{ item }">
          <v-chip :color="item.is_active ? 'green' : 'red'" variant="flat" size="small">
            {{ item.is_active ? 'Activa' : 'Inactiva' }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn icon @click="editConsole(item)" class="mr-1" :disabled="!item.is_active">
            <v-icon color="primary">mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon @click="handleSoftDeleteConsole(item.id)" v-if="item.is_active">
            <v-icon color="red">mdi-delete</v-icon>
          </v-btn>
          <v-btn icon @click="handleActivateConsole(item.id)" v-else>
            <v-icon color="success">mdi-check-circle</v-icon>
          </v-btn>
          <v-btn icon @click="handleHardDeleteConsole(item.id)" class="ml-1">
            <v-icon color="grey darken-2">mdi-eraser</v-icon>
          </v-btn>
        </template>
        <template v-slot:no-data>
          <v-alert :value="true" color="info" icon="mdi-information">
            No hay consolas disponibles.
          </v-alert>
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn text @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>

    <ConfirmDialog
      v-model="showConfirmDialog"
      :title="confirmDialogTitle"
      :message="confirmDialogMessage"
      :confirm-text="confirmDialogConfirmText"
      :confirm-color="confirmDialogConfirmColor"
      @confirm="handleConfirmAction"
      @cancel="handleCancelAction"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import ConsoleService, { ConsoleData, CreateConsolePayload, UpdateConsolePayload } from '../Services/ConsoleService';
import ConfirmDialog from '../components/ConfirmarDialogo.vue';

// Para el formulario de Vuetify
const form = ref<HTMLFormElement | null>(null);

// Variables reactivas para los datos del formulario
const consoles = ref<ConsoleData[]>([]);
const nombre = ref<string>('');
const fabricante = ref<string>('');
const serialNumber = ref<string>('');
const is_active = ref<boolean>(true); // Coherente con ConsoleData

// Variables de UI y estado
const search = ref<string>('');
const isEditing = ref<boolean>(false);
const editingConsoleId = ref<string | null>(null); // CORREGIDO: ID ahora es string

// Manejo de errores de validación y alertas
const validationErrors = ref<Record<string, string[]>>({});
const formAlertMessage = ref<string>('');
const showFormAlert = ref<boolean>(false);

// Snackbar para notificaciones
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
});

// Diálogo de confirmación
const showConfirmDialog = ref<boolean>(false);
const confirmDialogTitle = ref<string>('');
const confirmDialogMessage = ref<string>('');
const confirmDialogConfirmText = ref<string>('');
const confirmDialogConfirmColor = ref<string>('');
const currentAction = ref<string>(''); // 'create', 'update', 'soft_delete', 'activate', 'hard_delete'
const consoleToSoftDeleteId = ref<string | null>(null); // CORREGIDO: ID ahora es string
const consoleToActivateId = ref<string | null>(null); // CORREGIDO: ID ahora es string
const consoleToHardDeleteId = ref<string | null>(null); // CORREGIDO: ID ahora es string

// Configuración de ordenamiento de la tabla
type MySortItem = {
  key: string;
  order: boolean | 'asc' | 'desc' | undefined;
};
const sortBy = ref<MySortItem[]>([{ key: 'id', order: 'asc' }]);

// Filtro de estado para la tabla
const filtroEstadoTabla = ref<'todos' | boolean>('todos');

// Definición de los encabezados de la tabla
const headers = [
  { title: 'ID', key: 'id', sortable: false },
  { title: 'Nombre', key: 'name', sortable: false },
  { title: 'Fabricante', key: 'manufacturer', sortable: false },
  { title: 'Número de Serie', key: 'serialNumber', sortable: false },
  { title: 'Estado', key: 'is_active', sortable: false }, // Coherente con ConsoleData
  { title: 'Acciones', key: 'actions', sortable: false },
];

// REGLAS DE VALIDACIÓN FRONEND con Vuetify
const rules = {
  required: (value: string) => !!value || 'Este campo es requerido.',
  minLength: (v: string) => (v && v.length >= 3) || 'Mínimo 3 caracteres.',
  maxLength: (v: string) => (v && v.length <= 50) || 'Máximo 50 caracteres para el nombre.',
  descriptionMaxLength: (v: string) => (v && v.length <= 255) || 'Máximo 255 caracteres.',
  is_activeRequired: (value: boolean | null | undefined) => value !== null && value !== undefined || 'El estado es requerido.' // Coherente con is_active
};

// --- Mapeo de fabricantes a iconos de Material Design Icons ---
const consoleIcons: Record<string, string> = {
  'Sony': 'mdi-sony-playstation',
  'Microsoft': 'mdi-microsoft-xbox',
  'Nintendo': 'mdi-nintendo-switch',
  'Valve': 'mdi-steam',
  'Sega': 'mdi-controller',
  'Atari': 'mdi-gamepad-variant',
  'Default': 'mdi-gamepad',
};

function getConsoleIcon(manufacturer: string): string {
  return consoleIcons[manufacturer] || consoleIcons['Default'];
}
// --- FIN Mapeo de iconos ---


// --- FUNCIONES DE VALIDACIÓN ASÍNCRONAS PARA EL NOMBRE Y NÚMERO DE SERIE DE LA CONSOLA ---
async function validateNombreConsolaUnico(value: string): Promise<boolean | string> {
  if (!value) return true; 

  if (isEditing.value && editingConsoleId.value !== null) {
    const originalConsole = consoles.value.find(c => c.id === editingConsoleId.value); // Ya no se necesita toString()
    if (originalConsole && originalConsole.name.toLowerCase() === value.toLowerCase()) {
      return true;
    }
  }
  return true; 
}

async function validateNumeroSerieUnico(value: string): Promise<boolean | string> {
  if (!value) return true;

  if (isEditing.value && editingConsoleId.value !== null) {
    const originalConsole = consoles.value.find(c => c.id === editingConsoleId.value); // Ya no se necesita toString()
    if (originalConsole && originalConsole.serialNumber === value) {
      return true;
    }
  }
  return true; 
}
// --- FIN FUNCIONES DE VALIDACIÓN ASÍNCRONA ---

// Carga de consolas desde el servicio
async function cargarConsolas() {
  try {
    console.log('Cargando consolas...');
    const response = await ConsoleService.getConsoles(1, 100, true);
    consoles.value = response.consoles;
    console.log('Consolas cargadas exitosamente:', consoles.value);
  } catch (error: any) {
    console.error('Error al cargar consolas:', error);
    snackbar.value = { show: true, message: 'Error al cargar consolas.', color: 'error' };
  }
}

// Envío del formulario (crear o actualizar)
async function submitForm() {
  validationErrors.value = {};
  snackbar.value.show = false;
  formAlertMessage.value = '';
  showFormAlert.value = false;

  if (!form.value) return;
  const { valid } = await form.value.validate();

  if (!valid) {
    snackbar.value = { show: true, message: 'Por favor, corrige los errores del formulario antes de continuar.', color: 'warning' };
    return;
  }

  if (isEditing.value) {
    confirmDialogTitle.value = 'Confirmar Actualización de Consola';
    confirmDialogMessage.value = '¿Estás seguro de que quieres actualizar esta consola?';
    confirmDialogConfirmText.value = 'Actualizar';
    confirmDialogConfirmColor.value = 'primary';
    currentAction.value = 'update';
  } else {
    confirmDialogTitle.value = 'Confirmar Creación de Consola';
    confirmDialogMessage.value = '¿Estás seguro de que quieres crear esta consola?';
    confirmDialogConfirmText.value = 'Crear';
    confirmDialogConfirmColor.value = 'success';
    currentAction.value = 'create';
  }
  showConfirmDialog.value = true;
}

// Maneja la acción confirmada desde el diálogo
async function handleConfirmAction() {
  snackbar.value.show = false;
  validationErrors.value = {};
  formAlertMessage.value = '';
  showFormAlert.value = false;

  try {
    const consoleData: CreateConsolePayload | UpdateConsolePayload = {
      name: nombre.value,
      manufacturer: fabricante.value,
      serialNumber: serialNumber.value,
    };

    if (currentAction.value === 'create') {
      console.log('Intentando crear consola con datos:', consoleData);
      await ConsoleService.createConsole(consoleData as CreateConsolePayload);
      snackbar.value = { show: true, message: 'Consola creada exitosamente.', color: 'success' };
    } else if (currentAction.value === 'update') {
      if (editingConsoleId.value === null) throw new Error('ID de consola no definido para actualizar.');
      
      (consoleData as UpdateConsolePayload).is_active = is_active.value;
      
      console.log('Intentando actualizar consola ID:', editingConsoleId.value, 'con datos:', consoleData);
      await ConsoleService.updateConsole(editingConsoleId.value, consoleData as UpdateConsolePayload); // ID ya es string
      snackbar.value = { show: true, message: 'Consola actualizada correctamente.', color: 'success' };
    } else if (currentAction.value === 'soft_delete') {
      if (consoleToSoftDeleteId.value !== null) {
        console.log('Intentando inactivar consola ID:', consoleToSoftDeleteId.value);
        await ConsoleService.deactivateConsole(consoleToSoftDeleteId.value); // ID ya es string
        snackbar.value = { show: true, message: 'Consola inactivada correctamente.', color: 'success' };
        console.log('Soft delete exitoso para ID:', consoleToSoftDeleteId.value);
      }
    } else if (currentAction.value === 'activate') {
      if (consoleToActivateId.value !== null) {
        console.log('Intentando activar consola ID:', consoleToActivateId.value);
        await ConsoleService.activateConsole(consoleToActivateId.value); // ID ya es string
        snackbar.value = { show: true, message: 'Consola activada correctamente.', color: 'success' };
        console.log('Activación exitosa para ID:', consoleToActivateId.value);
      }
    } else if (currentAction.value === 'hard_delete') {
      if (consoleToHardDeleteId.value !== null) {
        console.log('Intentando eliminar permanentemente consola ID:', consoleToHardDeleteId.value);
        await ConsoleService.deleteConsolePermanently(consoleToHardDeleteId.value); // ID ya es string
        snackbar.value = { show: true, message: 'Consola eliminada definitivamente.', color: 'success' };
        console.log('Eliminación permanente exitosa para ID:', consoleToHardDeleteId.value);
      }
    }

    await cargarConsolas();
    console.log('Lista de consolas recargada después de la acción. Consolas:', consoles.value);
    resetForm();

  } catch (err: any) {
    console.error('Error en handleConfirmAction:', err);
    const errorMessage = err.data?.message || err.message || 'Error al procesar la operación de la consola. Intenta de nuevo más tarde.';
    snackbar.value = { show: true, message: errorMessage, color: 'error' };

    if (err.status === 409 && errorMessage.includes('El número de serie ya existe.')) {
      formAlertMessage.value = 'El número de serie ingresado ya está en uso. Por favor, elige uno diferente.';
      showFormAlert.value = true;
    }
  } finally {
    showConfirmDialog.value = false;
    currentAction.value = '';
    consoleToSoftDeleteId.value = null;
    consoleToActivateId.value = null;
    consoleToHardDeleteId.value = null;
  }
}

// Edita una consola
function editConsole(consoleItem: ConsoleData) {
  isEditing.value = true;
  editingConsoleId.value = consoleItem.id; // Asignación directa, ya es string
  nombre.value = consoleItem.name;
  fabricante.value = consoleItem.manufacturer;
  serialNumber.value = consoleItem.serialNumber;
  is_active.value = consoleItem.is_active;
  resetValidation();
  window.scrollTo({ top: 0, behavior: 'smooth'});
  console.log('Editando consola:', consoleItem);
}

// Maneja el soft delete
function handleSoftDeleteConsole(id: string) { // CORREGIDO: id es string
  consoleToSoftDeleteId.value = id;
  confirmDialogTitle.value = 'Confirmar Inactivación de Consola';
  confirmDialogMessage.value = '¿Estás seguro de que quieres inactivar esta consola? Se cambiará su estado a inactivo.';
  confirmDialogConfirmText.value = 'Inactivar';
  confirmDialogConfirmColor.value = 'error';
  currentAction.value = 'soft_delete';
  showConfirmDialog.value = true;
  console.log('Solicitud de soft delete para ID:', id);
}

// Maneja la activación de una consola
function handleActivateConsole(id: string) { // CORREGIDO: id es string
  consoleToActivateId.value = id;
  confirmDialogTitle.value = 'Confirmar Activación de Consola';
  confirmDialogMessage.value = '¿Estás seguro de que quieres activar esta consola? Se cambiará su estado a activo.';
  confirmDialogConfirmText.value = 'Activar';
  confirmDialogConfirmColor.value = 'success';
  currentAction.value = 'activate';
  showConfirmDialog.value = true;
  console.log('Solicitud de activación para ID:', id);
}

// Maneja la eliminación permanente
function handleHardDeleteConsole(id: string) { // CORREGIDO: id es string
  consoleToHardDeleteId.value = id;
  confirmDialogTitle.value = '¡ADVERTENCIA! Eliminación Permanente de Consola';
  confirmDialogMessage.value = 'Esta acción eliminará la consola de forma definitiva de la base de datos y no se podrá recuperar. ¿Estás absolutamente seguro?';
  confirmDialogConfirmText.value = 'Eliminar PERMANENTEMENTE';
  confirmDialogConfirmColor.value = 'red darken-3';
  currentAction.value = 'hard_delete';
  showConfirmDialog.value = true;
  console.log('Solicitud de eliminación permanente para ID:', id);
}

// Cancela la acción del diálogo
function handleCancelAction() {
  console.log('Acción de consola cancelada por el usuario.');
  resetForm();
  showConfirmDialog.value = false;
}

// Resetea el formulario y el estado de la UI
function resetForm() {
  console.log('Reseteando formulario...');
  nombre.value = '';
  fabricante.value = '';
  serialNumber.value = '';
  is_active.value = true;
  isEditing.value = false;
  editingConsoleId.value = null;
  consoleToSoftDeleteId.value = null;
  consoleToActivateId.value = null;
  consoleToHardDeleteId.value = null;
  resetValidation();
  snackbar.value.show = false;
  formAlertMessage.value = '';
  showFormAlert.value = false;
}

// Resetea las validaciones del formulario de Vuetify
function resetValidation() {
  validationErrors.value = {};
  if (form.value) {
    form.value.resetValidation();
    console.log('Validaciones del formulario reseteadas.');
  }
}

// Filtrado y ordenamiento de la tabla
const filteredConsoles = computed(() => {
  let filteredList = consoles.value;
  console.log('Recalculando filteredConsoles. Consolas originales (antes de búsqueda/filtro):', consoles.value.length);
  
  // Búsqueda
  if (search.value) {
    const searchTerm = search.value.trim().toLowerCase();
    filteredList = filteredList.filter(c =>
      c.name.toLowerCase().includes(searchTerm) ||
      c.manufacturer.toLowerCase().includes(searchTerm) ||
      c.serialNumber.toLowerCase().includes(searchTerm)
    );
    console.log('Después de búsqueda:', filteredList.length);
  }

  // Filtrado por estado
  if (filtroEstadoTabla.value !== 'todos') {
    filteredList = filteredList.filter(c => c.is_active === filtroEstadoTabla.value);
    console.log('Después de filtro por estado:', filteredList.length, 'Estado:', filtroEstadoTabla.value);
  }

  // Aplicar el ordenamiento
  if (sortBy.value && sortBy.value.length > 0) {
    const sortKey = sortBy.value[0].key;
    const sortOrder = sortBy.value[0].order;

    filteredList.sort((a, b) => {
      let valA: any = (a as any)[sortKey];
      let valB: any = (b as any)[sortKey];

      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valB > valA ? 1 : -1);
      }
    });
    console.log('Después de ordenamiento. Clave:', sortKey, 'Orden:', sortOrder);
  }

  return filteredList;
});

// Observar cambios en el filtro de estado para forzar una re-renderización del computed (aunque ya debería ser reactivo)
watch(filtroEstadoTabla, (newValue, oldValue) => {
  console.log('filtroEstadoTabla cambió de', oldValue, 'a', newValue);
});


// Ordenar por ID descendente al cargar
const sortByIdDesc = () => {
  sortBy.value = [{ key: 'id', order: 'desc' }];
};

// Cargar consolas al montar el componente
onMounted(() => {
  cargarConsolas();
  sortByIdDesc();
});
</script>

<style scoped>
/* Estilos existentes de tu componente de roles, adaptados o mantenidos */
.form {
  padding: 1rem;
}
.error-message {
  color: red;
  font-size: 0.85em;
  margin-top: 5px;
}
.text-h5, .text-h6 {
  color: #1976D2;
  font-weight: bold;
}
.v-btn-toggle .v-btn {
  min-width: 44px;
}
.v-data-table tbody tr {
  height: 48px;
  min-height: 48px;
}
.v-data-table tbody td {
  padding: 8px 16px;
}
/* Nuevos estilos o adaptaciones específicas para consolas */
.active {
  color: green;
  font-weight: bold;
}
.inactive {
  color: #888;
  font-style: italic;
}
.delete-btn {
  background-color: #dc3545; /* Red standard */
}
.delete-btn:hover:not(:disabled) {
  background-color: #c82333; /* Darker red on hover */
}
</style>