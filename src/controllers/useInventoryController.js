import { useState, useEffect } from 'react';
import { inventoryDAO } from '../dao/InventoryDAO';

export function useInventoryController(activeTab) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [inventarioMaestro, setInventarioMaestro] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        // Carga inicial (solo hace fetch si el DAO está vacío, o fuerza recarga)
        if (!inventoryDAO.db) {
          await inventoryDAO.loadInitialData();
        }
        
        if (!isMounted) return;

        setInventarioMaestro(inventoryDAO.getInventarioMaestro());

        // Filtrar según la pestaña activa
        if (activeTab === 'herramientas') {
          setData(inventoryDAO.getInventarioMaestro().filter(i => i.Tipo === 'Herramienta'));
        } else if (activeTab === 'tornilleria') {
          setData(inventoryDAO.getInventarioMaestro().filter(i => i.Tipo === 'Tornillería'));
        } else if (activeTab === 'consumibles') {
          setData(inventoryDAO.getInventarioMaestro().filter(i => i.Tipo !== 'Herramienta' && i.Tipo !== 'Tornillería'));
        } else {
          // Es un sistema (frenos, suspension, etc.)
          // Mapeamos el ID de la pestaña al nombre real del sistema
          const sistemasMap = {
            suspension: 'Suspensión y Dirección',
            drivetrain: 'DriveTrain',
            frame: 'Frame',
            electrico: 'Sistema Eléctrico',
            frenos: 'Frenos'
          };
          const sistema = sistemasMap[activeTab] || activeTab;
          setData(inventoryDAO.getComponentesPorSistema(sistema));
        }

      } catch (err) {
        console.error("Error cargando DB:", err);
        alert("Error cargando DB: " + err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const handleSave = async (formData, editRowIndex) => {
    setLoading(true);
    try {
      const isMasterInventory = ['herramientas', 'tornilleria', 'consumibles'].includes(activeTab);

      if (isMasterInventory) {
        let tipo = "";
        if (activeTab === 'herramientas') tipo = 'Herramienta';
        else if (activeTab === 'tornilleria') tipo = 'Tornillería';
        else tipo = 'Consumible';
        
        const recordData = {
          Id_Item: editRowIndex || "",
          Tipo: formData.Tipo || tipo,
          Categoria: formData.Categoria || "",
          Descripcion: formData.Descripcion || "",
          Stock_Taller: formData.Stock_Taller || 0
        };

        await inventoryDAO.guardarRegistro('Inventario_Maestro', recordData);
      } else {
        const componente = {
          Id_Componente: editRowIndex || "",
          Nombre: formData.Nombre,
          Sistema: formData.Sistema || activeTab,
          Observaciones: formData.Observaciones || ""
        };

        const requisitos = [];

        // Tornillería: recorrer la lista dinámica
        if (formData.requisitosTornilleria) {
          formData.requisitosTornilleria.forEach(r => {
            if (r.id && r.cant) {
              requisitos.push({ Id_Item: r.id, Cantidad_Necesaria: r.cant });
            }
          });
        }

        // Herramientas: recorrer la lista dinámica
        if (formData.requisitosHerramientas) {
          formData.requisitosHerramientas.forEach(r => {
            if (r.id && r.cant) {
              requisitos.push({ Id_Item: r.id, Cantidad_Necesaria: r.cant });
            }
          });
        }

        await inventoryDAO.guardarComponente(componente, requisitos);
      }
      
      // Refrescar data
      setInventarioMaestro(inventoryDAO.getInventarioMaestro());
      const sistemaActual = activeTab;
      if (sistemaActual === 'herramientas') {
        setData(inventoryDAO.getInventarioMaestro().filter(i => i.Tipo === 'Herramienta'));
      } else if (sistemaActual === 'tornilleria') {
        setData(inventoryDAO.getInventarioMaestro().filter(i => i.Tipo === 'Tornillería'));
      } else if (sistemaActual === 'consumibles') {
        setData(inventoryDAO.getInventarioMaestro().filter(i => i.Tipo !== 'Herramienta' && i.Tipo !== 'Tornillería'));
      } else {
        const sistemasMap = {
          suspension: 'Suspensión y Dirección',
          drivetrain: 'DriveTrain',
          frame: 'Frame',
          electrico: 'Sistema Eléctrico',
          frenos: 'Frenos'
        };
        const sistema = sistemasMap[sistemaActual] || sistemaActual;
        setData(inventoryDAO.getComponentesPorSistema(sistema));
      }
    } catch(err) {
      alert("Error al guardar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este registro? Esta acción es permanente y puede borrar los requisitos asociados.")) {
      return;
    }

    setLoading(true);
    try {
      let tabla = "";
      let idColName = "";
      
      if (['herramientas', 'tornilleria', 'consumibles'].includes(activeTab)) {
        tabla = 'Inventario_Maestro';
        idColName = 'Id_Item';
      } else {
        tabla = 'Componentes';
        idColName = 'Id_Componente';
      }

      await inventoryDAO.eliminarRegistro(tabla, idColName, id);
      
      // Refrescar data
      setInventarioMaestro(inventoryDAO.getInventarioMaestro());
      const sistemaActual = activeTab;
      
      if (sistemaActual === 'herramientas') {
        setData(inventoryDAO.getInventarioMaestro().filter(i => i.Tipo === 'Herramienta'));
      } else if (sistemaActual === 'tornilleria') {
        setData(inventoryDAO.getInventarioMaestro().filter(i => i.Tipo === 'Tornillería'));
      } else if (sistemaActual === 'consumibles') {
        setData(inventoryDAO.getInventarioMaestro().filter(i => i.Tipo !== 'Herramienta' && i.Tipo !== 'Tornillería'));
      } else {
        const sistemasMap = {
          suspension: 'Suspensión y Dirección',
          drivetrain: 'DriveTrain',
          frame: 'Frame',
          electrico: 'Sistema Eléctrico',
          frenos: 'Frenos'
        };
        const sistema = sistemasMap[sistemaActual] || sistemaActual;
        setData(inventoryDAO.getComponentesPorSistema(sistema));
      }
    } catch(err) {
      alert("Error al eliminar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    data,
    inventarioMaestro,
    handleSave,
    handleDelete
  };
}
