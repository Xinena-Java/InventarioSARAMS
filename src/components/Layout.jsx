export default function Layout({ children, activeTab, setActiveTab, onLogout }) {
  const tabs = [
    { id: 'suspension', label: 'Suspensión y Dirección' },
    { id: 'drivetrain', label: 'DriveTrain' },
    { id: 'frame', label: 'Frame' },
    { id: 'electrico', label: 'Sistema Eléctrico' },
    { id: 'frenos', label: 'Frenos' },
    { id: 'checklist', label: 'Checklist Competición' },
    { id: 'herramientas', label: 'Herramientas' },
    { id: 'tornilleria', label: 'Tornillería' },
    { id: 'consumibles', label: 'Consumibles' }
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div>
          <h1 className="sidebar-title">Inventario SARAMS</h1>
          <nav>
            {tabs.map(tab => (
              <div 
                key={tab.id}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </div>
            ))}
          </nav>
        </div>
        
        {/* Logout Button at the bottom */}
        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <button 
            className="btn btn-secondary" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={onLogout}
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
