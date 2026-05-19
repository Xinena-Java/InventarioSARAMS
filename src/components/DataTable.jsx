import { useState } from 'react';

export default function DataTable({ 
  title, 
  columns, 
  data, 
  loading, 
  onSave, 
  onDelete 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [editRowIndex, setEditRowIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleOpenModal = (row = null) => {
    if (row) {
      setFormData(row);
      setEditRowIndex(row._rowIndex);
    } else {
      setFormData({});
      setEditRowIndex(null);
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({});
    setEditRowIndex(null);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, editRowIndex);
    handleCloseModal();
  };

  // Lógica de búsqueda (Filtra por cualquier columna que coincida con el texto)
  const filteredData = data.filter(row => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    return columns.some(col => {
      const val = row[col.key];
      return val && String(val).toLowerCase().includes(lowerSearch);
    });
  });

  return (
    <div className="data-panel">
      <div className="page-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <h2 className="page-title">{title}</h2>
        
        <div style={{ display: 'flex', gap: '1rem', flex: 1, justifyContent: 'flex-end' }}>
          <input 
            type="text" 
            placeholder="Buscar por ID, Nombre..." 
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
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, idx) => (
                <tr key={idx}>
                  {columns.map(col => (
                    <td key={col.key}>{row[col.key]}</td>
                  ))}
                  <td>
                    <button className="btn btn-secondary" style={{padding: '0.25rem 0.75rem', marginRight: '0.5rem'}} onClick={() => handleOpenModal(row)}>
                      Editar
                    </button>
                    <button className="btn btn-danger" style={{padding: '0.25rem 0.75rem'}} onClick={() => onDelete(row._rowIndex)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && data.length > 0 && (
                <tr>
                  <td colSpan={columns.length + 1} style={{textAlign: 'center', padding: '2rem'}}>
                    No se encontraron resultados para "{searchTerm}"
                  </td>
                </tr>
              )}
              {data.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} style={{textAlign: 'center', padding: '2rem'}}>
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
          <div className="modal-content">
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
