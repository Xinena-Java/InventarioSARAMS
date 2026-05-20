import { gasAPI } from '../services/gas-api';

class InventoryDAO {
  constructor() {
    this.db = null;
    this.isLoaded = false;
    this.itemsMap = null;
    this.componentesPorSistemaCache = {};
  }

  async loadInitialData() {
    // No recargar si ya está cargado
    if (this.isLoaded && this.db) {
      return this.db;
    }
    
    this.db = await gasAPI.obtenerBaseDeDatosInicial();
    this._buildIndexes();
    this.isLoaded = true;
    return this.db;
  }

  _buildIndexes() {
    // Crear Map de items para búsquedas O(1)
    this.itemsMap = new Map();
    if (this.db.Inventario_Maestro) {
      for (const item of this.db.Inventario_Maestro) {
        this.itemsMap.set(String(item.Id_Item), item);
      }
    }
    this.componentesPorSistemaCache = {};
  }

  getComponentesPorSistema(sistema) {
    if (!this.db || !this.db.Componentes) return [];
    
    // Usar caché si existe
    if (this.componentesPorSistemaCache[sistema]) {
      return this.componentesPorSistemaCache[sistema];
    }
    
    const sistemaLower = sistema.toLowerCase();
    const componentes = this.db.Componentes.filter(c => 
      (c.Sistema || '').toLowerCase() === sistemaLower
    );
    
    // Usar índice en lugar de find para búsquedas O(1)
    const result = componentes.map(c => {
      const requisitos = this.db.Requisitos_Componente.filter(r => String(r.Id_Componente) === String(c.Id_Componente));
      
      const requisitosCompletos = requisitos.map(r => {
        const item = this.itemsMap.get(String(r.Id_Item));
        return {
          ...r,
          Descripcion: item ? item.Descripcion : "Desconocido",
          Categoria: item ? item.Categoria : ""
        };
      });

      return {
        ...c,
        requisitos: requisitosCompletos
      };
    });
    
    // Guardar en caché
    this.componentesPorSistemaCache[sistema] = result;
    return result;
  }

  getInventarioMaestro() {
    if (!this.db) return [];
    return this.db.Inventario_Maestro || [];
  }

  async guardarComponente(componenteData, requisitosData) {
    const result = await gasAPI.guardarComponenteCompleto(componenteData, requisitosData);
    if (result.success) {
      // Solo marcar como no cargado, la recarga será lazy cuando sea necesaria
      this.isLoaded = false;
      this.componentesPorSistemaCache = {};
    }
    return result;
  }

  async actualizarComponente(componenteData, requisitosData) {
    const result = await gasAPI.actualizarComponente(componenteData, requisitosData);
    if (result.success) {
      this.isLoaded = false;
      this.componentesPorSistemaCache = {};
    }
    return result;
  }

  async guardarRegistro(tabla, datos) {
    const result = await gasAPI.guardarRegistro(tabla, datos);
    if (result.success) {
      this.isLoaded = false;
      this.componentesPorSistemaCache = {};
    }
    return result;
  }

  async eliminarRegistro(tabla, idColName, idValor) {
    const result = await gasAPI.eliminarRegistro(tabla, idColName, idValor);
    if (result.success) {
      this.isLoaded = false;
      this.componentesPorSistemaCache = {};
    }
    return result;
  }

  generarBOMTotal() {
    if (!this.db || !this.db.Requisitos_Componente || !this.db.Inventario_Maestro) return [];
    return this._calcularBOM(this.db.Componentes.map(c => String(c.Id_Componente)));
  }

  // Genera BOM solo para los componentes seleccionados
  generarBOMPorComponentes(idsComponentes) {
    if (!this.db || !this.db.Requisitos_Componente || !this.db.Inventario_Maestro) return [];
    return this._calcularBOM(idsComponentes.map(String));
  }

  // Lógica interna compartida de cálculo de BOM
  _calcularBOM(idsComponentes) {
    const bomMap = new Map();

    for (const req of this.db.Requisitos_Componente) {
      if (!idsComponentes.includes(String(req.Id_Componente))) continue;
      const idItem = String(req.Id_Item);
      const cant = Number(req.Cantidad_Necesaria) || 0;
      bomMap.set(idItem, (bomMap.get(idItem) || 0) + cant);
    }

    const bomFinal = [];
    for (const [idItem, totalRequerida] of bomMap.entries()) {
      const itemMaestro = this.db.Inventario_Maestro.find(i => String(i.Id_Item) === idItem);
      bomFinal.push({
        Id_Item: idItem,
        Descripcion: itemMaestro ? itemMaestro.Descripcion : 'Desconocido',
        Categoria: itemMaestro ? itemMaestro.Categoria : 'Desconocida',
        Tipo: itemMaestro ? itemMaestro.Tipo : '',
        Cantidad_Requerida: totalRequerida
      });
    }

    // Ordenar por Tipo para que salgan agrupados
    bomFinal.sort((a, b) => (a.Tipo || '').localeCompare(b.Tipo || ''));
    return bomFinal;
  }

  // Devuelve todos los componentes agrupados por sistema
  getTodosLosComponentes() {
    if (!this.db || !this.db.Componentes) return {};
    const grupos = {};
    for (const c of this.db.Componentes) {
      const sistema = c.Sistema || 'Sin sistema';
      if (!grupos[sistema]) grupos[sistema] = [];
      grupos[sistema].push(c);
    }
    return grupos;
  }
}

export const inventoryDAO = new InventoryDAO();
