import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // <-- NUEVA IMPORTACIÓN (necesitarás instalarla)

// --- Definición del Usuario ---
interface User {
  id: number;
  username: string;
}
// --- Definición del Contexto ---
interface AuthContextType {
  token: string | null;
  user: User | null; // <-- AÑADIDO
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null); // <-- AÑADIDO

  const logout = () => {
    setToken(null);
    setUser(null); // <-- AÑADIDO
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
    console.log("Sesión cerrada y token eliminado.");
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        password,
      });
      const { token } = response.data;

      setToken(token);
      localStorage.setItem('authToken', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // --- NUEVO: Decodificar el token para obtener el usuario ---
      const decodedToken: { user: User } = jwtDecode(token);
      setUser(decodedToken.user); // <-- AÑADIDO
      // --- FIN DE NUEVO ---

    } catch (error) {
      console.error("Error en login:", error);
      logout();
      throw new Error('Credenciales inválidas. Por favor, intente de nuevo.');
    }
  };
  
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      // --- NUEVO: Cargar usuario desde el token guardado ---
      try {
        const decodedToken: { user: User } = jwtDecode(storedToken);
        setUser(decodedToken.user);
      } catch (error) {
        console.error("Token guardado inválido:", error);
        logout(); // Limpia si el token está corrupto
      }
      // --- FIN DE NUEVO ---
    }

    // Interceptor de Axios (sin cambios)
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          console.error("Error de autenticación detectado. Cerrando sesión.");
          logout();
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  
  const value = {
    token,
    user, // <-- AÑADIDO
    isAuthenticated: !!token,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook Personalizado
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};