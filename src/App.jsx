import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import DataTable from './components/DataTable';
import { fetchSheetData, createRow, updateRow, deleteRow } from './services/api';

const VIEWS = {
  sistemas: {
    title: 'Sistemas Principales',
    sheetName: 'Sistemas Principales', // Exact name in Google Sheets
    columns: [
      { key: 'ID_Pieza', label: 'ID Pieza' },
      { key: 'Sistema', label: 'Sistema' },
      { key: 'Nombre de la pieza', label: 'Nombre de la pieza' },
      { key: 'Cantidad', label: 'Cantidad', type: 'number' },
      { key: 'Tornilleria Empleada', label: 'Tornillería Empleada', required: false },
      { key: 'Herramienta Requerida', label: 'Herramienta Requerida', required: false }
    ]
  },
  inventario: {
    title: 'Inventario General',
    sheetName: 'Inventario General',
    columns: [
      { key: 'Categoria', label: 'Categoría' },
      { key: 'descripcion', label: 'Descripción' },
      { key: 'cantidad', label: 'Cantidad', type: 'number' }
    ]
  },
  consumibles: {
    title: 'Consumibles',
    sheetName: 'Consumibles', // Corregido de Cosumibles a Consumibles
    columns: [
      { key: 'Nombre', label: 'Nombre' },
      { key: 'Cantidad', label: 'Cantidad', type: 'number' },
      { key: 'Unidad', label: 'Unidad', required: false }
    ]
  }
};

function App() {
  const [activeTab, setActiveTab] = useState('sistemas');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentView = VIEWS[activeTab];

  const loadData = async () => {
    setLoading(true);
    const sheetData = await fetchSheetData(currentView.sheetName);
    setData(sheetData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleSave = async (formData, rowIndex) => {
    setLoading(true);
    if (rowIndex) {
      // Editar
      await updateRow(currentView.sheetName, rowIndex, formData);
    } else {
      // Crear
      await createRow(currentView.sheetName, formData);
    }
    await loadData();
  };

  const handleDelete = async (rowIndex) => {
    if(window.confirm('¿Estás seguro de eliminar este registro?')) {
      setLoading(true);
      await deleteRow(currentView.sheetName, rowIndex);
      await loadData();
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <DataTable 
        title={currentView.title}
        columns={currentView.columns}
        data={data}
        loading={loading}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </Layout>
  );
}

export default App;
