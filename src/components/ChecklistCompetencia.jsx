import { useState, useEffect } from 'react';
import { inventoryDAO } from '../dao/InventoryDAO';
import { gasAPI } from '../services/gas-api';

export default function ChecklistCompetencia() {
  const [competencia, setCompetencia] = useState('');
  const [bomData, setBomData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({});

  useEffect(() => {
    // Cuando se monta, generamos el BOM Total
    const cargarBOM = async () => {
      setLoading(true);
      try {
        if (!inventoryDAO.db) {
          await inventoryDAO.loadInitialData();
        }
        const bom = inventoryDAO.generarBOMTotal();
        setBomData(bom);
        
        // Inicializar estado de los inputs
        const initialInputs = {};
        bom.forEach(item => {
          initialInputs[item.Id_Item] = {
            Cant_Llevada: '',
            Cant_Regresada: ''
          };
        });
        setInputs(initialInputs);

      } catch (e) {
        console.error(e);
        alert("Error cargando BOM");
      } finally {
        setLoading(false);
      }
    };
    cargarBOM();
  }, []);

  const handleInputChange = (idItem, field, value) => {
    setInputs(prev => ({
      ...prev,
      [idItem]: {
        ...prev[idItem],
        [field]: value
      }
    }));
  };

  const recolectarYGuardar = async () => {
    if (!competencia.trim()) {
      alert("Por favor ingresa el nombre de la competencia.");
      return;
    }

    // Armar el arreglo de objetos filtrando los que tengan al menos cantidad llevada
    const itemsArray = [];
    
    bomData.forEach(item => {
      const vals = inputs[item.Id_Item];
      if (vals.Cant_Llevada || vals.Cant_Regresada) {
        itemsArray.push({
          Id_Item: item.Id_Item,
          Cant_Llevada: Number(vals.Cant_Llevada) || 0,
          Cant_Regresada: Number(vals.Cant_Regresada) || 0
        });
      }
    });

    if (itemsArray.length === 0) {
      alert("No has llenado ninguna cantidad en la checklist.");
      return;
    }

    setLoading(true);
    try {
      await gasAPI.guardarChecklistEvento(competencia, itemsArray);
      alert("Checklist guardada exitosamente.");
      // Limpiar formulario opcionalmente
      setCompetencia('');
      const resetInputs = {};
      bomData.forEach(item => {
        resetInputs[item.Id_Item] = { Cant_Llevada: '', Cant_Regresada: '' };
      });
      setInputs(resetInputs);
    } catch (e) {
      alert("Error guardando checklist: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && bomData.length === 0) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
        <p style={{marginTop: '1rem'}}>Calculando Lista de Materiales...</p>
      </div>
    );
  }

  return (
    <div className="data-panel">
      <div className="page-header" style={{ flexWrap: 'wrap', gap: '1rem', flexDirection: 'column', alignItems: 'flex-start' }}>
        <h2 className="page-title">Checklist de Competición (BOM Total)</h2>
        <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '600px' }}>
          <input 
            type="text" 
            placeholder="Nombre de la Competencia (Ej. Regional 2026)" 
            className="form-input" 
            style={{ flex: 1, margin: 0 }}
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
          />
          <button className="btn" onClick={recolectarYGuardar} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Checklist'}
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Descripción del Ítem</th>
              <th>Categoría</th>
              <th>Cant. Requerida (Total)</th>
              <th>Cant. Llevada</th>
              <th>Cant. Regresada</th>
            </tr>
          </thead>
          <tbody>
            {bomData.map((item) => (
              <tr key={item.Id_Item}>
                <td>{item.Descripcion}</td>
                <td>{item.Categoria}</td>
                <td style={{fontWeight: 'bold', color: 'var(--primary)'}}>{item.Cantidad_Requerida}</td>
                <td style={{width: '120px'}}>
                  <input 
                    type="number"
                    className="form-input"
                    style={{margin: 0, padding: '0.25rem'}}
                    value={inputs[item.Id_Item]?.Cant_Llevada || ''}
                    onChange={(e) => handleInputChange(item.Id_Item, 'Cant_Llevada', e.target.value)}
                  />
                </td>
                <td style={{width: '120px'}}>
                  <input 
                    type="number"
                    className="form-input"
                    style={{margin: 0, padding: '0.25rem'}}
                    value={inputs[item.Id_Item]?.Cant_Regresada || ''}
                    onChange={(e) => handleInputChange(item.Id_Item, 'Cant_Regresada', e.target.value)}
                  />
                </td>
              </tr>
            ))}
            {bomData.length === 0 && (
              <tr>
                <td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>
                  No hay componentes ni requisitos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
