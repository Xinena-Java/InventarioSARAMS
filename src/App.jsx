import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import DataTable from './components/DataTable';
import Login from './components/Login';
import { fetchSheetData, createRow, updateRow, deleteRow } from './services/api';

const systemColumns = [
  { key: 'Nombre de la pieza', label: 'Nombre de la Pieza' },
  { key: 'Cantidad', label: 'Cantidad', type: 'number' },
  { key: 'Tornilleria Empleada', label: 'Tornillería Empleada', required: false },
  { key: 'Herramienta Requerida', label: 'Herramienta Requerida', required: false }
];

const VIEWS = {
  suspension: { title: 'Suspensión y Dirección', sheetName: 'Suspension y Direccion', columns: systemColumns },
  drivetrain: { title: 'DriveTrain', sheetName: 'DriveTrain', columns: systemColumns },
  frame: { title: 'Frame', sheetName: 'Frame', columns: systemColumns },
  electrico: { title: 'Sistema Eléctrico', sheetName: 'Sistema Electrico', columns: systemColumns },
  frenos: { title: 'Frenos', sheetName: 'Frenos', columns: systemColumns },
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
    sheetName: 'Consumibles',
    columns: [
      { key: 'Nombre', label: 'Nombre' },
      { key: 'Cantidad', label: 'Cantidad', type: 'number' },
      { key: 'Unidad', label: 'Unidad', required: false }
    ]
  }
};

function App() {
  const [apiKey, setApiKey] = useState(sessionStorage.getItem('apiKey') || null);
  const [activeTab, setActiveTab] = useState('suspension');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentView = VIEWS[activeTab];

  // Attempt Login
  const handleLogin = async (password) => {
    // Probamos descargar la primera hoja que sabemos que existe
    try {
      await fetchSheetData('Suspension y Direccion', password);
    } catch (err) {
      if (err.message === 'No autorizado') {
        throw new Error('Contraseña incorrecta');
      } else if (err.message !== 'Hoja no encontrada') {
        throw err; // Otros errores de red
      }
      // Si dice "Hoja no encontrada", significa que la contraseña era correcta (pasó el filtro) pero la hoja no existe. Lo dejamos pasar.
    }
    
    sessionStorage.setItem('apiKey', password);
    setApiKey(password);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('apiKey');
    setApiKey(null);
    setData([]);
  };

  const loadData = async () => {
    if (!apiKey) return;
    setLoading(true);
    try {
      const sheetData = await fetchSheetData(currentView.sheetName, apiKey);
      setData(sheetData);
    } catch (err) {
      if (err.message === 'No autorizado') {
        handleLogout();
      } else {
        alert("Error cargando tabla: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, apiKey]);

  const handleSave = async (formData, rowIndex) => {
    setLoading(true);
    if (rowIndex) {
      await updateRow(currentView.sheetName, rowIndex, formData, apiKey);
    } else {
      await createRow(currentView.sheetName, formData, apiKey);
    }
    await loadData();
  };

  const handleDelete = async (rowIndex) => {
    if(window.confirm('¿Estás seguro de eliminar este registro?')) {
      setLoading(true);
      await deleteRow(currentView.sheetName, rowIndex, apiKey);
      await loadData();
    }
  };

  // Render Login if no valid API key
  if (!apiKey) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}>
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
