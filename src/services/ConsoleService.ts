// src/services/ConsoleService.ts

// Define la URL base de tu API de backend
// ¡IMPORTANTE! Asegúrate que esta URL sea correcta y tu backend esté corriendo en ella.
// Si tu backend no está en 3333, cámbialo aquí.
const API_URL = 'http://localhost:3333/api/consoles'; 

// --- Interfaces para los datos de la Consola ---
export interface ConsoleData {
  id: string; 
  name: string;
  manufacturer: string;
  serialNumber: string;
  is_active: boolean; // Lo esperamos como boolean en el frontend
  createdAt: string;
  updatedAt: string;
}

export type CreateConsolePayload = Omit<ConsoleData, 'id' | 'is_active' | 'createdAt' | 'updatedAt'>;
export type UpdateConsolePayload = Partial<Omit<ConsoleData, 'id' | 'createdAt' | 'updatedAt'>>;

// --- Interfaz para la Respuesta Paginada del Backend ---
export interface PaginatedResponse<T> {
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    first_page: number;
    first_page_url: string;
    last_page_url: string;
    next_page_url: string | null;
    prev_page_url: string | null;
  };
  consoles: T[]; // El array de consolas
}

// --- Servicio de Consolas ---
const ConsoleService = {
  /**
   * Transforma el objeto de consola recibido del backend.
   * Convierte `isActive` (del backend, numérico 0/1) a `is_active` (booleano para el frontend).
   * @param consoleObj Objeto de consola tal como viene del backend.
   * @returns Objeto de consola transformado.
   */
  _transformConsoleData(consoleObj: any): ConsoleData {
    // Asegúrate de que consoleObj.isActive exista y sea un número o bool.
    // Usamos !! para convertir 0 o 1 a false o true respectivamente.
    return {
      ...consoleObj,
      is_active: !!consoleObj.isActive 
    };
  },

  /**
   * Manejador genérico de respuestas para `fetch`.
   */
  async _handleResponse(response: Response): Promise<Response> {
    if (!response.ok) {
      let errorData: { message?: string };
      try {
        errorData = await response.json();
      } catch (e) {
        throw new Error(`Error de red: ${response.status} ${response.statusText}`);
      }
      throw new Error(errorData.message || 'Ocurrió un error en el servidor.');
    }
    return response;
  },

  /**
   * Obtiene una lista de consolas con paginación desde el backend.
   */
  async getConsoles(page: number = 1, limit: number = 10, includeInactive: boolean = false): Promise<PaginatedResponse<ConsoleData>> {
    try {
      const url = new URL(API_URL);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', limit.toString());
      url.searchParams.append('includeInactive', includeInactive ? '1' : '0'); 

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data: PaginatedResponse<any> = await this._handleResponse(response).then(res => res.json());
      // Transforma cada consola en el array antes de retornarlo
      data.consoles = data.consoles.map(this._transformConsoleData); 
      return data as PaginatedResponse<ConsoleData>;
    } catch (error: any) {
      console.error('Error al obtener consolas:', error.message);
      throw error;
    }
  },

  /**
   * Obtiene una única consola por su identificador único.
   */
  async getConsoleById(id: string): Promise<ConsoleData> {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data: { message: string; console: any } = await this._handleResponse(response).then(res => res.json());
      return this._transformConsoleData(data.console); 
    } catch (error: any) {
      console.error(`Error al obtener consola con ID ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Crea una nueva consola en el backend.
   */
  async createConsole(consoleData: CreateConsolePayload): Promise<ConsoleData> {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consoleData), // consoleData ya no debe tener is_active, se envía solo name, manufacturer, serialNumber
      });

      const data: { message: string; console: any } = await this._handleResponse(response).then(res => res.json());
      return this._transformConsoleData(data.console); 
    } catch (error: any) {
      console.error('Error al crear consola:', error.message);
      throw error;
    }
  },

  /**
   * Actualiza los datos de una consola existente en el backend.
   */
  async updateConsole(id: string, consoleData: UpdateConsolePayload): Promise<ConsoleData> {
    try {
      // Creamos un payload para enviar al backend
      const payload: { [key: string]: any } = { ...consoleData };
      
      // Si `is_active` está presente en `consoleData` (viene del frontend como booleano)
      // lo transformamos a `isActive` (0 o 1) para el backend y eliminamos `is_active`.
      if (typeof payload.is_active === 'boolean') {
        payload.isActive = payload.is_active ? 1 : 0;
        delete payload.is_active; 
      }

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: { message: string; console: any } = await this._handleResponse(response).then(res => res.json());
      return this._transformConsoleData(data.console); 
    } catch (error: any) {
      console.error(`Error al actualizar consola con ID ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Desactiva lógicamente una consola en el backend (soft delete).
   * Utilizamos PUT para cambiar el estado.
   */
  async deactivateConsole(id: string): Promise<ConsoleData> {
    try {
      // Directamente llamamos a updateConsole para cambiar solo el estado a inactivo
      return this.updateConsole(id, { is_active: false }); 
    } catch (error: any) {
      console.error(`Error al desactivar consola con ID ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Activa lógicamente una consola en el backend.
   * Utilizamos PUT para cambiar el estado.
   */
  async activateConsole(id: string): Promise<ConsoleData> {
    try {
      // Directamente llamamos a updateConsole para cambiar solo el estado a activo
      return this.updateConsole(id, { is_active: true }); 
    } catch (error: any) {
      console.error(`Error al activar consola con ID ${id}:`, error.message);
      throw error;
    }
  }
};

export default ConsoleService;