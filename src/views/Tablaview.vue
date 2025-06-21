<template>
  <div>
    <h1>Gestión de Usuarios</h1>

    <!-- Formulario para agregar -->
    <div style="margin-bottom: 1rem;">
      <input v-model="nuevoNombre" placeholder="Nombre" />
      <input v-model="nuevoCorreo" placeholder="Correo" />
      <button @click="crearUsuario">Crear</button>
      <button @click="limpiarTabla">Limpiar Todo</button>
    </div>

    <!-- Tabla -->
    <table border="1" cellpadding="8" cellspacing="0">
      <thead>
        <tr>
          <th>#</th>
          <th>Nombre</th>
          <th>Correo</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(usuario, index) in usuarios" :key="index">
          <td>{{ index + 1 }}</td>
          <td>{{ usuario.nombre }}</td>
          <td>{{ usuario.correo }}</td>
          <td>
            <button @click="eliminarUsuario(index)">Eliminar</button>
          </td>
        </tr>
        <tr v-if="usuarios.length === 0">
          <td colspan="4" style="text-align: center;">No hay usuarios</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Usuario {
  nombre: string
  correo: string
}

const usuarios = ref<Usuario[]>([])

const nuevoNombre = ref('')
const nuevoCorreo = ref('')

const crearUsuario = () => {
  if (nuevoNombre.value.trim() === '' || nuevoCorreo.value.trim() === '') {
    alert('Por favor, complete ambos campos')
    return
  }

  usuarios.value.push({
    nombre: nuevoNombre.value,
    correo: nuevoCorreo.value,
  })

  nuevoNombre.value = ''
  nuevoCorreo.value = ''
}

const eliminarUsuario = (index: number) => {
  usuarios.value.splice(index, 1)
}

const limpiarTabla = () => {
  usuarios.value = []
}
</script>

<style scoped>
input {
  margin-right: 8px;
  padding: 4px;
}
button {
  margin-right: 8px;
  padding: 4px 8px;
  cursor: pointer;
}
table {
  width: 100%;
  margin-top: 1rem;
  border-collapse: collapse;
}
</style>
