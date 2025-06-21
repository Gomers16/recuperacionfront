<template>
  <v-dialog v-model="dialog" max-width="500">
    <v-card>
      <v-card-title class="headline">{{ title }}</v-card-title>
      <v-card-text>
        {{ message }}
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey" text @click="cancel">Cancelar</v-btn>
        <v-btn :color="confirmColor" text @click="confirm">{{ confirmText }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: { // v-model para controlar la visibilidad desde el padre
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: 'Confirmar Acción',
  },
  message: {
    type: String,
    default: '¿Estás seguro de que quieres realizar esta acción?',
  },
  confirmText: {
    type: String,
    default: 'Confirmar',
  },
  confirmColor: {
    type: String,
    default: 'primary', // Color por defecto para la acción de confirmar
  },
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const dialog = ref(props.modelValue);

// Sincronizar el estado interno del diálogo con la prop modelValue
watch(() => props.modelValue, (newVal) => {
  dialog.value = newVal;
});

// Cuando el diálogo interno cambia, emitir el evento para el padre
watch(dialog, (newVal) => {
  if (!newVal) { // Si el diálogo se cierra (ej. haciendo clic fuera)
    emit('update:modelValue', false);
    emit('cancel'); // También se considera una cancelación
  }
});

function confirm() {
  emit('confirm');
  emit('update:modelValue', false); // Cierra el modal después de confirmar
}

function cancel() {
  emit('cancel');
  emit('update:modelValue', false); // Cierra el modal
}
</script>