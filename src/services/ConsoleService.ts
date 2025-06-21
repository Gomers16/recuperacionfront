// src/services/ConsoleService.ts

// Define la URL base de tu API de backend
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
    path: string;
  };
  consoles: T[];
}

// --- Clase de Error Personalizada para incluir el status ---
class ServiceError extends Error {
  status?: number;
  data?: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = 'ServiceError';
    this.status = status;
    this.data = data;
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, ServiceError.prototype);
  }
}

// --- Servicio de Consolas ---
const ConsoleService = {
  _transformConsoleData(consoleObj: any): ConsoleData {
    // Asegura que is_active sea siempre boolean, incluso si backend envía null/undefined
    return {
      ...consoleObj,
      id: consoleObj.id.toString(), // Asegúrate de que el ID siempre sea string
      is_active: !!consoleObj.isActive // Convertir backend 'isActive' a frontend 'is_active'
    };
  },

  async _handleResponse(response: Response): Promise<Response> {
    if (!response.ok) {
      let errorData: { message?: string, errors?: any };
      try {
        errorData = await response.json();
      } catch (e) {
        // Si la respuesta no es JSON o hay un error de parseo
        throw new ServiceError(`Error de red: ${response.status} ${response.statusText}`, response.status);
      }
      
      let fullErrorMessage = errorData.message || `Ocurrió un error en el servidor con status ${response.status}.`;
      if (errorData.errors) {
          for (const key in errorData.errors) {
              if (errorData.errors.hasOwnProperty(key)) {
                  fullErrorMessage += `\n${key}: ${errorData.errors[key].join(', ')}`;
              }
          }
      }
      // Lanzar un ServiceError con el status y los datos del error
      throw new ServiceError(fullErrorMessage, response.status, errorData);
    }
    return response;
  },

  /**
   * Obtiene una lista de consolas con paginación, filtros y ordenamiento desde el backend.
   * @param page Número de página.
   * @param limit Cantidad de elementos por página.
   * @param includeInactive Booleano para incluir consolas inactivas (si se usa en un checkbox general).
   * @param sortBy Columna por la que ordenar.
   * @param sortOrder Dirección del orden (asc/desc).
   * @param searchQuery Término de búsqueda.
   * @param filterStatus Booleano para filtrar por estado activo/inactivo (true para activas, false para inactivas). Si es undefined, no se filtra por estado.
   */
  async getConsoles(
    page: number = 1, 
    limit: number = 10, 
    includeInactive: boolean = false, 
    sortBy?: string, 
    sortOrder?: 'asc' | 'desc', 
    searchQuery?: string,
    filterStatus?: boolean 
  ): Promise<PaginatedResponse<ConsoleData>> {
    try {
      const url = new URL(API_URL);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', limit.toString());
      
      if (filterStatus !== undefined && filterStatus !== null) {
          url.searchParams.append('is_active', filterStatus ? '1' : '0');
      } else {
          url.searchParams.append('includeInactive', includeInactive ? '1' : '0'); 
      }

      if (sortBy) {
        url.searchParams.append('sortBy', sortBy);
      }
      if (sortOrder) {
        url.searchParams.append('sortOrder', sortOrder);
      }
      if (searchQuery) {
        url.searchParams.append('search', searchQuery);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data: PaginatedResponse<any> = await this._handleResponse(response).then(res => res.json());
      // Mapear cada consola a ConsoleData, asegurando que el ID sea string y is_active sea boolean
      data.consoles = data.consoles.map(this._transformConsoleData); 
      return data as PaginatedResponse<ConsoleData>;
    } catch (error: any) {
      console.error('Error al obtener consolas:', error.message);
      throw error; // Re-lanzar el error para que el componente lo maneje
    }
  },

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

  async createConsole(consoleData: CreateConsolePayload): Promise<ConsoleData> {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consoleData),
      });

      const data: { message: string; console: any } = await this._handleResponse(response).then(res => res.json());
      return this._transformConsoleData(data.console); 
    } catch (error: any) {
      console.error('Error al crear consola:', error.message);
      throw error;
    }
  },

  async updateConsole(id: string, consoleData: UpdateConsolePayload): Promise<ConsoleData> {
    try {
      const payload: { [key: string]: any } = { ...consoleData };
      
      // Si is_active está presente en consoleData, lo transformamos a 'isActive' (number) para el backend
      if (typeof payload.is_active === 'boolean') {
        payload.isActive = payload.is_active ? 1 : 0; // Convertir frontend 'is_active' a backend 'isActive'
        delete payload.is_active; // Eliminar la propiedad 'is_active' original
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

  async deactivateConsole(id: string): Promise<ConsoleData> {
    try {
      return this.updateConsole(id, { is_active: false }); 
    } catch (error: any) {
      console.error(`Error al desactivar consola con ID ${id}:`, error.message);
      throw error;
    }
  },

  async activateConsole(id: string): Promise<ConsoleData> {
    try {
      return this.updateConsole(id, { is_active: true }); 
    } catch (error: any) {
      console.error(`Error al activar consola con ID ${id}:`, error.message);
      throw error;
    }
  },

  async deleteConsolePermanently(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      await this._handleResponse(response); 
    } catch (error: any) {
      console.error(`Error al eliminar permanentemente consola con ID ${id}:`, error.message);
      throw error;
    }
  }
};

export default ConsoleService;