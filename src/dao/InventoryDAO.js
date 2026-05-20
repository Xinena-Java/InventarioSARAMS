import { gasAPI } from '../services/gas-api';

class InventoryDAO {
  constructor() {
    this.db = null;
  }

  async loadInitialData() {
    this.db = await gasAPI.obtenerBaseDeDatosInicial();
    return this.db;
  }

  getComponentesPorSistema(sistema) {
    if (!this.db || !this.db.Componentes) return [];
    
    // Filtramos los componentes por sistema
    const componentes = this.db.Componentes.filter(c => c.Sistema === sistema);
    
    // Para cada componente, anexamos sus requisitos "adornados" con el nombre del ítem
    return componentes.map(c => {
      const requisitos = this.db.Requisitos_Componente.filter(r => String(r.Id_Componente) === String(c.Id_Componente));
      
      const requisitosCompletos = requisitos.map(r => {
        const item = this.db.Inventario_Maestro.find(i => String(i.Id_Item) === String(r.Id_Item));
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
  }

  getInventarioMaestro() {
    if (!this.db) return [];
    return this.db.Inventario_Maestro || [];
  }

  async guardarComponente(componenteData, requisitosData) {
    // requisitosData debe ser un arreglo de { Id_Item, Cantidad_Necesaria }
    const result = await gasAPI.guardarComponenteCompleto(componenteData, requisitosData);
    if (result.success) {
      // Recargar datos en memoria (en una app real mutaríamos this.db o haríamos refetch)
      await this.loadInitialData();
    }
    return result;
  }

  async guardarRegistro(tabla, datos) {
    const result = await gasAPI.guardarRegistro(tabla, datos);
    if (result.success) {
      await this.loadInitialData();
    }
    return result;
  }

  async eliminarRegistro(tabla, idColName, idValor) {
    const result = await gasAPI.eliminarRegistro(tabla, idColName, idValor);
    if (result.success) {
      await this.loadInitialData();
    }
    return result;
  }

  generarBOMTotal() {
    if (!this.db || !this.db.Requisitos_Componente || !this.db.Inventario_Maestro) return [];
    
    const bomMap = new Map();
    
    // Sumar todas las cantidades requeridas por ítem
    for (const req of this.db.Requisitos_Componente) {
      const idItem = String(req.Id_Item);
      const cant = Number(req.Cantidad_Necesaria) || 0;
      
      if (bomMap.has(idItem)) {
        bomMap.set(idItem, bomMap.get(idItem) + cant);
      } else {
        bomMap.set(idItem, cant);
      }
    }
    
    // Cruzar con Inventario_Maestro
    const bomFinal = [];
    for (const [idItem, totalRequerida] of bomMap.entries()) {
      const itemMaestro = this.db.Inventario_Maestro.find(i => String(i.Id_Item) === idItem);
      bomFinal.push({
        Id_Item: idItem,
        Descripcion: itemMaestro ? itemMaestro.Descripcion : 'Desconocido',
        Categoria: itemMaestro ? itemMaestro.Categoria : 'Desconocida',
        Cantidad_Requerida: totalRequerida
      });
    }
    
    return bomFinal;
  }
}

export const inventoryDAO = new InventoryDAO();
