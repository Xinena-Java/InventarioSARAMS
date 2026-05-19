import { useState } from 'react';

export default function Layout({ children, activeTab, setActiveTab }) {
  const tabs = [
    { id: 'suspension', label: 'Suspensión y Dirección' },
    { id: 'drivetrain', label: 'DriveTrain' },
    { id: 'frame', label: 'Frame' },
    { id: 'electrico', label: 'Sistema Eléctrico' },
    { id: 'frenos', label: 'Frenos' },
    { id: 'inventario', label: 'Inventario General' },
    { id: 'consumibles', label: 'Consumibles' }
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h1 className="sidebar-title">Inventario Baja SAE</h1>
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
      </aside>
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
