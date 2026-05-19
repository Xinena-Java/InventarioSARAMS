import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import DataTable from './components/DataTable';
import { fetchSheetData, createRow, updateRow, deleteRow } from './services/api';

const systemColumns = [
  { key: 'Nombre de la pieza', label: 'Nombre de la Pieza' },
  { key: 'Cantidad', label: 'Cantidad', type: 'number' },
  { key: 'Tornilleria Empleada', label: 'Tornillería Empleada', required: false },
  { key: 'Herramienta Requerida', label: 'Herramienta Requerida', required: false }
];

const VIEWS = {
  suspension: {
    title: 'Suspensión y Dirección',
    sheetName: 'Suspension y Direccion',
    columns: systemColumns
  },
  drivetrain: {
    title: 'DriveTrain',
    sheetName: 'DriveTrain',
    columns: systemColumns
  },
  frame: {
    title: 'Frame',
    sheetName: 'Frame',
    columns: systemColumns
  },
  electrico: {
    title: 'Sistema Eléctrico',
    sheetName: 'Sistema Electrico',
    columns: systemColumns
  },
  frenos: {
    title: 'Frenos',
    sheetName: 'Frenos',
    columns: systemColumns
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
    sheetName: 'Consumibles',
    columns: [
      { key: 'Nombre', label: 'Nombre' },
      { key: 'Cantidad', label: 'Cantidad', type: 'number' },
      { key: 'Unidad', label: 'Unidad', required: false }
    ]
  }
};

function App() {
  // Ajustamos el estado inicial a 'suspension' en lugar de 'sistemas'
  const [activeTab, setActiveTab] = useState('suspension');
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
