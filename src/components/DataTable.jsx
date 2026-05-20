import { useState } from 'react';

export default function DataTable({ 
  title, 
  columns, 
  data, 
  loading, 
  onSave, 
  onDelete,
  inventarioMaestro = [],
  isComponentView = false
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [editRowIndex, setEditRowIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Listas dinámicas de requisitos
  const [tornilleriaRows, setTornilleriaRows] = useState([{ id: '', cant: '' }]);
  const [herramientaRows, setHerramientaRows] = useState([{ id: '', cant: '' }]);

  const handleOpenModal = (row = null) => {
    if (row) {
      setFormData(row);
      setEditRowIndex(row.Id_Componente || row.Id_Item);
    } else {
      setFormData({});
      setEditRowIndex(null);
    }
    // Reiniciar listas dinámicas al abrir
    setTornilleriaRows([{ id: '', cant: '' }]);
    setHerramientaRows([{ id: '', cant: '' }]);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({});
    setEditRowIndex(null);
    setTornilleriaRows([{ id: '', cant: '' }]);
    setHerramientaRows([{ id: '', cant: '' }]);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Funciones para listas dinámicas de Tornillería ---
  const handleTornilleriaChange = (index, field, value) => {
    setTornilleriaRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };
  const addTornilleriaRow = () => setTornilleriaRows(prev => [...prev, { id: '', cant: '' }]);
  const removeTornilleriaRow = (index) => setTornilleriaRows(prev => prev.filter((_, i) => i !== index));

  // --- Funciones para listas dinámicas de Herramientas ---
  const handleHerramientaChange = (index, field, value) => {
    setHerramientaRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };
  const addHerramientaRow = () => setHerramientaRows(prev => [...prev, { id: '', cant: '' }]);
  const removeHerramientaRow = (index) => setHerramientaRows(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = (e) => {
    e.preventDefault();
    // Empacar las listas de requisitos dentro de formData
    const dataWithRequisitos = {
      ...formData,
      requisitosTornilleria: tornilleriaRows.filter(r => r.id),
      requisitosHerramientas: herramientaRows.filter(r => r.id),
    };
    onSave(dataWithRequisitos, editRowIndex);
    handleCloseModal();
  };

  const uniqueCategories = [...new Set(data.map(item => item.Categoria))].filter(Boolean);

  const filteredData = data.filter(row => {
    let matchesSearch = true;
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      matchesSearch = columns.some(col => {
        const val = row[col.key];
        return val && String(val).toLowerCase().includes(lowerSearch);
      });
    }
    let matchesCategory = true;
    if (categoryFilter) {
      matchesCategory = row.Categoria === categoryFilter;
    }
    return matchesSearch && matchesCategory;
  });

  const herramientas = inventarioMaestro.filter(i => i.Tipo === 'Herramienta');
  const tornilleria = inventarioMaestro.filter(i => i.Tipo === 'Tornillería');

  return (
    <div className="data-panel">
      <div className="page-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <h2 className="page-title">{title}</h2>
        <div style={{ display: 'flex', gap: '1rem', flex: 1, justifyContent: 'flex-end' }}>
          {!isComponentView && (
            <select 
              className="form-input" 
              style={{ maxWidth: '200px', margin: 0 }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="form-input" 
            style={{ maxWidth: '300px', margin: 0 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn" onClick={() => handleOpenModal()}>
            + Agregar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
          <p style={{marginTop: '1rem'}}>Cargando datos...</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {columns.map(col => <th key={col.key}>{col.label}</th>)}
                {isComponentView && <th>Requisitos (Tornillería / Herramientas)</th>}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, idx) => (
                <tr key={idx}>
                  {columns.map(col => (
                    <td key={col.key}>{row[col.key]}</td>
                  ))}
                  
                  {isComponentView && (
                    <td>
                      {row.requisitos && row.requisitos.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                          {row.requisitos.map((r, i) => (
                            <li key={i}>{r.Cantidad_Necesaria}x {r.Descripcion}</li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{color: '#888'}}>Ninguno</span>
                      )}
                    </td>
                  )}

                  <td>
                    <button className="btn btn-secondary" style={{padding: '0.25rem 0.75rem', marginRight: '0.5rem'}} onClick={() => handleOpenModal(row)}>
                      Editar
                    </button>
                    <button className="btn btn-danger" style={{padding: '0.25rem 0.75rem'}} onClick={() => onDelete(row.Id_Componente || row.Id_Item)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && data.length > 0 && (
                <tr>
                  <td colSpan={columns.length + (isComponentView ? 2 : 1)} style={{textAlign: 'center', padding: '2rem'}}>
                    No se encontraron resultados para "{searchTerm}"
                  </td>
                </tr>
              )}
              {data.length === 0 && (
                <tr>
                  <td colSpan={columns.length + (isComponentView ? 2 : 1)} style={{textAlign: 'center', padding: '2rem'}}>
                    No hay datos disponibles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="modal-title">{editRowIndex ? 'Editar Elemento' : 'Nuevo Elemento'}</h3>
            <form onSubmit={handleSubmit}>
              {columns.map(col => (
                <div className="form-group" key={col.key}>
                  <label className="form-label">{col.label}</label>
                  <input 
                    type={col.type || 'text'}
                    className="form-input"
                    name={col.key}
                    value={formData[col.key] || ''}
                    onChange={handleChange}
                    required={col.required !== false}
                  />
                </div>
              ))}

              {/* Sección de Requisitos Dinámicos — solo en vistas de Componentes */}
              {isComponentView && !editRowIndex && (
                <>
                  <hr style={{margin: '1.5rem 0', borderColor: 'var(--border)'}} />
                  <h4 style={{ color: 'var(--text-bright)', marginBottom: '1rem' }}>Requisitos del Componente</h4>

                  {/* ---- Sección Tornillería ---- */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label className="form-label" style={{ margin: 0 }}>Tornillería Empleada</label>
                      <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }} onClick={addTornilleriaRow}>
                        + Añadir Tornillo
                      </button>
                    </div>
                    {tornilleriaRows.map((row, index) => (
                      <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <select
                          className="form-input"
                          style={{ flex: 1, margin: 0 }}
                          value={row.id}
                          onChange={(e) => handleTornilleriaChange(index, 'id', e.target.value)}
                        >
                          <option value="">-- Seleccionar --</option>
                          {tornilleria.map(t => (
                            <option key={t.Id_Item} value={t.Id_Item}>{t.Descripcion} ({t.Categoria})</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="Cant."
                          style={{ width: '75px', margin: 0 }}
                          value={row.cant}
                          min="1"
                          onChange={(e) => handleTornilleriaChange(index, 'cant', e.target.value)}
                        />
                        {tornilleriaRows.length > 1 && (
                          <button type="button" onClick={() => removeTornilleriaRow(index)}
                            style={{ background: 'var(--danger, #e53e3e)', border: 'none', color: 'white', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontWeight: 'bold', flexShrink: 0 }}>
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* ---- Sección Herramientas ---- */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label className="form-label" style={{ margin: 0 }}>Herramientas Requeridas</label>
                      <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }} onClick={addHerramientaRow}>
                        + Añadir Herramienta
                      </button>
                    </div>
                    {herramientaRows.map((row, index) => (
                      <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <select
                          className="form-input"
                          style={{ flex: 1, margin: 0 }}
                          value={row.id}
                          onChange={(e) => handleHerramientaChange(index, 'id', e.target.value)}
                        >
                          <option value="">-- Seleccionar --</option>
                          {herramientas.map(h => (
                            <option key={h.Id_Item} value={h.Id_Item}>{h.Descripcion} ({h.Categoria})</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="Cant."
                          style={{ width: '75px', margin: 0 }}
                          value={row.cant}
                          min="1"
                          onChange={(e) => handleHerramientaChange(index, 'cant', e.target.value)}
                        />
                        {herramientaRows.length > 1 && (
                          <button type="button" onClick={() => removeHerramientaRow(index)}
                            style={{ background: 'var(--danger, #e53e3e)', border: 'none', color: 'white', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontWeight: 'bold', flexShrink: 0 }}>
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
