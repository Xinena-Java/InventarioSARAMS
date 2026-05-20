import { useState } from 'react';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await onLogin(password);
    } catch (err) {
      setError('Contraseña incorrecta o error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      width: '100vw'
    }}>
      <div className="data-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-bright)', marginBottom: '1.5rem' }}>Acceso Requerido</h2>
        <p style={{ color: 'var(--text-main)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Ingresa la clave secreta para acceder al inventario de SARAMS.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input 
              type="password"
              className="form-input"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ textAlign: 'center', letterSpacing: '2px' }}
            />
          </div>
          
          {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</p>}
          
          <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Verificando...' : 'Entrar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}
