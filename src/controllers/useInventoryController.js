import { useState, useEffect } from 'react';
import { inventoryDAO } from '../dao/InventoryDAO';

export function useInventoryController(activeTab) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [inventarioMaestro, setInventarioMaestro] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Cargar datos solo una vez al montar el componente
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      setLoading(true);
      try {
        // Carga inicial: cargar del DAO (que hará caching)
        if (!inventoryDAO.isLoaded) {
          await inventoryDAO.loadInitialData();
        }
        
        if (!isMounted) return;
        setDataLoaded(true);
        setInventarioMaestro(inventoryDAO.getInventarioMaestro());
      } catch (err) {
        console.error("Error cargando DB:", err);
        alert("Error cargando DB: " + err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []); // Vacío: solo corre al montar

  // Filtrar y actualizar vista según la pestaña activa (sin recargar datos)
  useEffect(() => {
    if (!dataLoaded) return;

    const filterAndSetData = () => {
      if (activeTab === 'herramientas') {
        setData(inventoryDAO.getInventarioMaestro().filter(i => i.Tipo === 'Herramienta'));
      } else if (activeTab === 'tornilleria') {
        setData(inventoryDAO.getInventarioMaestro().filter(i => i.Tipo === 'Tornillería'));
      } else if (activeTab === 'consumibles') {
        setData(inventoryDAO.getInventarioMaestro().filter(i => i.Tipo !== 'Herramienta' && i.Tipo !== 'Tornillería'));
      } else {
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
    };

    filterAndSetData();
  }, [activeTab, dataLoaded]); // Solo corre cuando cambia activeTab o cuando se cargan datos

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
        const sistemasMap = {
          suspension: 'Suspensión y Dirección',
          drivetrain: 'DriveTrain',
          frame: 'Frame',
          electrico: 'Sistema Eléctrico',
          frenos: 'Frenos'
        };
        const sistemaNombre = sistemasMap[activeTab] || activeTab;

        const componente = {
          Id_Componente: editRowIndex || "",
          Nombre: formData.Nombre,
          Sistema: sistemaNombre,
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

        // Consumibles: recorrer la lista dinámica
        if (formData.requisitosConsumibles) {
          formData.requisitosConsumibles.forEach(r => {
            if (r.id && r.cant) {
              requisitos.push({ Id_Item: r.id, Cantidad_Necesaria: r.cant });
            }
          });
        }

        // Decidir si crear o actualizar
        if (editRowIndex) {
          // Actualizar componente existente
          await inventoryDAO.actualizarComponente(componente, requisitos);
        } else {
          // Crear nuevo componente
          await inventoryDAO.guardarComponente(componente, requisitos);
        }
      }
      
      // Recargar datos después de guardar
      await inventoryDAO.loadInitialData();
      const newInventario = inventoryDAO.getInventarioMaestro();
      setInventarioMaestro(newInventario);
      
      // Filtrar según la pestaña activa
      if (activeTab === 'herramientas') {
        setData(newInventario.filter(i => i.Tipo === 'Herramienta'));
      } else if (activeTab === 'tornilleria') {
        setData(newInventario.filter(i => i.Tipo === 'Tornillería'));
      } else if (activeTab === 'consumibles') {
        setData(newInventario.filter(i => i.Tipo !== 'Herramienta' && i.Tipo !== 'Tornillería'));
      } else {
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
      
      // Recargar datos después de eliminar
      await inventoryDAO.loadInitialData();
      const newInventario = inventoryDAO.getInventarioMaestro();
      setInventarioMaestro(newInventario);
      
      // Filtrar según la pestaña activa
      if (activeTab === 'herramientas') {
        setData(newInventario.filter(i => i.Tipo === 'Herramienta'));
      } else if (activeTab === 'tornilleria') {
        setData(newInventario.filter(i => i.Tipo === 'Tornillería'));
      } else if (activeTab === 'consumibles') {
        setData(newInventario.filter(i => i.Tipo !== 'Herramienta' && i.Tipo !== 'Tornillería'));
      } else {
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
