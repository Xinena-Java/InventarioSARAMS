import { useState, useEffect } from 'react';
import { inventoryDAO } from '../dao/InventoryDAO';
import { gasAPI } from '../services/gas-api';

const TIPO_LABELS = {
  'Herramienta': '🔧 Herramienta',
  'Tornillería': '🔩 Tornillería',
  'Consumible': '🛢️ Consumible',
};

export default function ChecklistCompetencia() {
  const [step, setStep] = useState(1); // Paso 1: Selección | Paso 2: BOM
  const [competencia, setCompetencia] = useState('');
  const [componentesPorSistema, setComponentesPorSistema] = useState({});
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [bomData, setBomData] = useState([]);
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        if (!inventoryDAO.db) {
          await inventoryDAO.loadInitialData();
        }
        setComponentesPorSistema(inventoryDAO.getTodosLosComponentes());
      } catch (e) {
        alert("Error cargando componentes: " + e.message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  // Seleccionar / Deseleccionar un componente
  const toggleComponente = (idComponente) => {
    setSeleccionados(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(idComponente)) nuevo.delete(idComponente);
      else nuevo.add(idComponente);
      return nuevo;
    });
  };

  // Seleccionar / Deseleccionar todos los de un sistema
  const toggleSistema = (componentesDeSistema) => {
    const ids = componentesDeSistema.map(c => c.Id_Componente);
    const todosSeleccionados = ids.every(id => seleccionados.has(id));
    setSeleccionados(prev => {
      const nuevo = new Set(prev);
      ids.forEach(id => todosSeleccionados ? nuevo.delete(id) : nuevo.add(id));
      return nuevo;
    });
  };

  // Paso 1 → 2: Calcular BOM de seleccionados
  const generarBOM = () => {
    if (!competencia.trim()) {
      alert("Por favor ingresa el nombre de la competencia primero.");
      return;
    }
    if (seleccionados.size === 0) {
      alert("Selecciona al menos un componente.");
      return;
    }

    const bom = inventoryDAO.generarBOMPorComponentes([...seleccionados]);
    setBomData(bom);

    const initialInputs = {};
    bom.forEach(item => {
      initialInputs[item.Id_Item] = { Cant_Llevada: '', Cant_Regresada: '' };
    });
    setInputs(initialInputs);
    setStep(2);
  };

  const handleInputChange = (idItem, field, value) => {
    setInputs(prev => ({
      ...prev,
      [idItem]: { ...prev[idItem], [field]: value }
    }));
  };

  const recolectarYGuardar = async () => {
    const itemsArray = bomData
      .filter(item => inputs[item.Id_Item]?.Cant_Llevada || inputs[item.Id_Item]?.Cant_Regresada)
      .map(item => ({
        Id_Item: item.Id_Item,
        Cant_Llevada: Number(inputs[item.Id_Item]?.Cant_Llevada) || 0,
        Cant_Regresada: Number(inputs[item.Id_Item]?.Cant_Regresada) || 0
      }));

    if (itemsArray.length === 0) {
      alert("Llena al menos una cantidad en la checklist.");
      return;
    }

    setLoading(true);
    try {
      await gasAPI.guardarChecklistEvento(competencia, itemsArray);
      alert("¡Checklist guardada exitosamente!");
      // Resetear todo
      setStep(1);
      setCompetencia('');
      setSeleccionados(new Set());
      setBomData([]);
      setInputs({});
    } catch (e) {
      alert("Error guardando checklist: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const totalSistemas = Object.keys(componentesPorSistema).length;
  const totalComponentes = Object.values(componentesPorSistema).flat().length;

  if (loading && totalComponentes === 0) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
        <p style={{ marginTop: '1rem' }}>Cargando componentes...</p>
      </div>
    );
  }

  return (
    <div className="data-panel">
      {/* Encabezado */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: '1rem', flexDirection: 'column', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
          <h2 className="page-title">Checklist de Competición</h2>
          {/* Indicador de pasos */}
          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
            <span style={{
              padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 'bold',
              background: step === 1 ? 'var(--primary)' : 'var(--surface2, #333)',
              color: step === 1 ? 'white' : 'var(--text-muted)'
            }}>1. Seleccionar Piezas</span>
            <span style={{
              padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 'bold',
              background: step === 2 ? 'var(--primary)' : 'var(--surface2, #333)',
              color: step === 2 ? 'white' : 'var(--text-muted)'
            }}>2. Checklist de Materiales</span>
          </div>
        </div>

        {/* Campo del nombre siempre visible */}
        <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '500px' }}>
          <input
            type="text"
            placeholder="Nombre de la Competencia (Ej. Regional 2026)"
            className="form-input"
            style={{ flex: 1, margin: 0 }}
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value.toUpperCase())}
          />
        </div>
      </div>

      {/* ===== PASO 1: SELECCIÓN DE COMPONENTES ===== */}
      {step === 1 && (
        <div>
          {totalComponentes === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '1.1rem' }}>No hay componentes registrados en ningún sistema.</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Agrega piezas desde las pestañas de Suspensión, Frenos, etc. para poder crear una checklist.</p>
            </div>
          ) : (
            <>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Selecciona las piezas que llevarás a la competencia. El sistema calculará automáticamente todo lo que necesitas.
                <strong style={{ color: 'var(--text-bright)' }}> ({seleccionados.size} de {totalComponentes} piezas seleccionadas)</strong>
              </p>

              {Object.entries(componentesPorSistema).map(([sistema, componentes]) => {
                const todosSeleccionados = componentes.every(c => seleccionados.has(c.Id_Componente));
                return (
                  <div key={sistema} style={{
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    overflow: 'hidden'
                  }}>
                    {/* Cabecera del sistema */}
                    <div style={{
                      background: 'var(--surface2, #1e1e2e)',
                      padding: '0.6rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer'
                    }} onClick={() => toggleSistema(componentes)}>
                      <input
                        type="checkbox"
                        checked={todosSeleccionados}
                        onChange={() => toggleSistema(componentes)}
                        onClick={e => e.stopPropagation()}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span style={{ fontWeight: 'bold', color: 'var(--text-bright)', fontSize: '0.95rem' }}>
                        {sistema}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 'auto' }}>
                        {componentes.filter(c => seleccionados.has(c.Id_Componente)).length}/{componentes.length} seleccionadas
                      </span>
                    </div>

                    {/* Componentes del sistema */}
                    <div style={{ padding: '0.5rem 1rem' }}>
                      {componentes.map(comp => (
                        <div key={comp.Id_Componente} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.4rem 0',
                          borderBottom: '1px solid var(--border)',
                          cursor: 'pointer'
                        }} onClick={() => toggleComponente(comp.Id_Componente)}>
                          <input
                            type="checkbox"
                            checked={seleccionados.has(comp.Id_Componente)}
                            onChange={() => toggleComponente(comp.Id_Componente)}
                            onClick={e => e.stopPropagation()}
                            style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                          />
                          <span style={{ color: 'var(--text-main)' }}>{comp.Nombre}</span>
                          {comp.Observaciones && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                              — {comp.Observaciones}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  className="btn"
                  onClick={generarBOM}
                  disabled={seleccionados.size === 0 || loading}
                  style={{ padding: '0.6rem 1.5rem' }}
                >
                  Generar Checklist de Materiales →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== PASO 2: CHECKLIST BOM ===== */}
      {step === 2 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem' }} onClick={() => setStep(1)}>
              ← Volver a selección
            </button>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {bomData.length} ítem(s) requeridos por {seleccionados.size} pieza(s) seleccionada(s)
            </p>
            <button className="btn" onClick={recolectarYGuardar} disabled={loading}>
              {loading ? 'Guardando...' : '💾 Guardar Checklist'}
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Cant. Requerida</th>
                  <th>Cant. Llevada</th>
                  <th>Cant. Regresada</th>
                </tr>
              </thead>
              <tbody>
                {bomData.map((item) => (
                  <tr key={item.Id_Item}>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem',
                        background: item.Tipo === 'Herramienta' ? '#2d4a22' : item.Tipo === 'Tornillería' ? '#1e2d4a' : '#3d2d1e',
                        color: 'white'
                      }}>
                        {TIPO_LABELS[item.Tipo] || item.Tipo || 'Consumible'}
                      </span>
                    </td>
                    <td>{item.Descripcion}</td>
                    <td>{item.Categoria}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--primary)', textAlign: 'center' }}>
                      {item.Cantidad_Requerida}
                    </td>
                    <td style={{ width: '110px' }}>
                      <input
                        type="number"
                        className="form-input"
                        style={{ margin: 0, padding: '0.25rem' }}
                        value={inputs[item.Id_Item]?.Cant_Llevada || ''}
                        onChange={(e) => handleInputChange(item.Id_Item, 'Cant_Llevada', e.target.value)}
                      />
                    </td>
                    <td style={{ width: '110px' }}>
                      <input
                        type="number"
                        className="form-input"
                        style={{ margin: 0, padding: '0.25rem' }}
                        value={inputs[item.Id_Item]?.Cant_Regresada || ''}
                        onChange={(e) => handleInputChange(item.Id_Item, 'Cant_Regresada', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
