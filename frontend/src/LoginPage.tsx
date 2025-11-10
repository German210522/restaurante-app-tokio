import React, { useState } from 'react';
import { useAuth } from './AuthContext';
// CORRECCIÓN: Asumiendo que guardaste el archivo como 'tokio-logo.jpeg'
import logo from './assets/tokio-logo.png'; 

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError('Usuario o contraseña incorrectos.');
      setPassword(''); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Efectos de "luz" (ahora marrones) */}
        <div className="neon-light-top"></div>
        <div className="neon-light-bottom"></div>

        {/* --- LOGO AÑADIDO --- */}
        <img src={logo} alt="Tokio Bakery Logo" className="login-logo" />

        <h1>TOKIO RESTAURANTE</h1>
        <p>Accede al panel de gestión.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              placeholder="Nombre de usuario"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Tu contraseña secreta"
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '15px' }}>
            {loading ? 'Verificando...' : 'INICIAR SESIÓN'}
          </button>
          
          {error && <p className="message-error" style={{ marginTop: '25px' }}>{error}</p>}
        </form>
      </div>
      <p className="login-footer">
        &copy; 2023 Sistema de Reservas del Restaurante.
      </p>
    </div>
  );
}

export default LoginPage;