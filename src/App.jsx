import { useState } from 'react';
import Layout from './components/Layout';
import DataTable from './components/DataTable';
import ChecklistCompetencia from './components/ChecklistCompetencia';
import Login from './components/Login';
import { useInventoryController } from './controllers/useInventoryController';

// Contraseña del sistema - CAMBIAR A UNA SEGURA
const CORRECT_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'CabraSalvaje-777';

const systemColumns = [
  { key: 'Nombre', label: 'Nombre' },
  { key: 'Observaciones', label: 'Observaciones', required: false }
];

const VIEWS = {
  suspension: { title: 'Suspensión y Dirección', sheetName: 'Suspension y Direccion', columns: systemColumns },
  drivetrain: { title: 'DriveTrain', sheetName: 'DriveTrain', columns: systemColumns },
  frame: { title: 'Frame', sheetName: 'Frame', columns: systemColumns },
  electrico: { title: 'Sistema Eléctrico', sheetName: 'Sistema Electrico', columns: systemColumns },
  frenos: { title: 'Frenos', sheetName: 'Frenos', columns: systemColumns },
  herramientas: {
    title: 'Herramientas',
    sheetName: 'Inventario Maestro',
    columns: [
      { key: 'Categoria', label: 'Categoría (ej. Llave)' },
      { key: 'Descripcion', label: 'Descripción' },
      { key: 'Stock_Taller', label: 'Stock', type: 'number' }
    ]
  },
  tornilleria: {
    title: 'Tornillería',
    sheetName: 'Inventario Maestro',
    columns: [
      { key: 'Categoria', label: 'Categoría (ej. Perno)' },
      { key: 'Descripcion', label: 'Descripción' },
      { key: 'Stock_Taller', label: 'Stock', type: 'number' }
    ]
  },
  consumibles: {
    title: 'Consumibles',
    sheetName: 'Consumibles',
    columns: [
      { key: 'Categoria', label: 'Categoría (ej. Aceite)' },
      { key: 'Descripcion', label: 'Nombre' },
      { key: 'Stock_Taller', label: 'Stock', type: 'number' }
    ]
  }
};

function App() {
  // Para Google Apps Script interno, podemos omitir el login o usar el apiKey
  const [apiKey, setApiKey] = useState(sessionStorage.getItem('apiKey') || null);
  const [activeTab, setActiveTab] = useState('suspension');
  
  // Usamos el Controlador MVC
  const { loading, data, inventarioMaestro, handleSave, handleDelete } = useInventoryController(activeTab);

  const currentView = VIEWS[activeTab];

  // Attempt Login
  const handleLogin = async (password) => {
    // Validar que la contraseña sea correcta
    if (password !== CORRECT_PASSWORD) {
      throw new Error('Contraseña incorrecta');
    }
    sessionStorage.setItem('apiKey', password);
    setApiKey(password);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('apiKey');
    setApiKey(null);
  };

  if (!apiKey) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}>
      {activeTab === 'checklist' ? (
        <ChecklistCompetencia />
      ) : (
        <DataTable 
          title={currentView.title}
          columns={currentView.columns}
          data={data}
          loading={loading}
          onSave={handleSave}
          onDelete={handleDelete}
          inventarioMaestro={inventarioMaestro}
          isComponentView={!['herramientas', 'tornilleria', 'consumibles'].includes(activeTab)}
        />
      )}
    </Layout>
  );
}

export default App;
