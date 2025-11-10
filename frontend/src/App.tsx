import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css'; 
import { io, Socket } from 'socket.io-client';

// Importa los componentes
import ReservationForm from './ReservationForm'; 
import ReservationManager from './ReservationManager';
import TableManager from './TableManager';
import ClientManager from './ClientManager';
import LoginPage from './LoginPage';
import OccupancyReport from './OccupancyReport';
import NotificationToast from './NotificationToast';
import DashboardHome from './DashboardHome';
import { useAuth } from './AuthContext';

// Interfaces (Interfaces locales para evitar errores de importación)
export interface Client { id: number; name: string; phone: string; email: string | null; loyalty_points: number; }
export interface Table { id: number; table_number: number; capacity: number; location: string | null; }
export interface BusinessHours { day_of_week: number; open_time: string; close_time: string; }

type View = 'home' | 'reservar' | 'ver_reservas' | 'admin_mesas' | 'admin_clientes' | 'reportes';

interface NotificationMessage {
  id: number;
  message: string;
}

function App() {
  const { isAuthenticated, logout, user } = useAuth();
  
  const [activeView, setActiveView] = useState<View>('home');
  
  const [clients, setClients] = useState<Client[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [notification, setNotification] = useState<NotificationMessage | null>(null);

  // --- Funciones de Carga (Estables con useCallback) ---
  const fetchClients = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/clients');
      setClients(response.data);
    } catch (error) { console.error("Error al cargar clientes:", error); }
  }, []);

  const fetchTables = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/tables');
      setTables(response.data);
    } catch (error) { console.error("Error al cargar mesas:", error); }
  }, []);

  const fetchBusinessHours = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/hours');
      setBusinessHours(response.data);
    } catch (error) { console.error("Error al cargar horarios:", error); }
  }, []);

  // --- Lógica de WebSocket y Carga de Datos ---
  useEffect(() => {
    let socket: Socket | undefined;
    if (isAuthenticated) {
      console.log("Autenticado. Cargando datos maestros...");
      fetchClients();
      fetchTables();
      fetchBusinessHours();
      console.log("Conectando al servidor WebSocket...");
      socket = io('http://localhost:5000'); 
      socket.on('upcoming_reservation', (data: NotificationMessage) => {
        console.log("¡Recordatorio recibido!", data.message);
        setNotification(data);
      });
    } else {
      console.log("No autenticado. Cargando horarios públicos.");
      fetchBusinessHours();
    }
    return () => {
      if (socket) {
        console.log("Desconectando del WebSocket.");
        socket.disconnect();
      }
    };
  }, [isAuthenticated, fetchClients, fetchTables, fetchBusinessHours]);

  
  // Renderizado Condicional
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Dashboard principal
  return (
    <div className="app-layout">
      
      {/* --- 1. EL MENÚ LATERAL --- */}
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <h1>Sistema de Reservas</h1>
        </div>

        <nav className="app-nav">
          <button 
            className={`app-nav-btn ${activeView === 'home' ? 'active' : ''}`}
            onClick={() => setActiveView('home')}
          >
            Inicio (Dashboard)
          </button>
          <button 
            className={`app-nav-btn ${activeView === 'reservar' ? 'active' : ''}`}
            onClick={() => setActiveView('reservar')}
          >
            Crear Reserva
          </button>
          <button 
            className={`app-nav-btn ${activeView === 'ver_reservas' ? 'active' : ''}`}
            onClick={() => setActiveView('ver_reservas')}
          >
            Ver Reservas
          </button>
          <button 
            className={`app-nav-btn ${activeView === 'reportes' ? 'active' : ''}`}
            onClick={() => setActiveView('reportes')}
          >
            Reportes
          </button>
          <button 
            className={`app-nav-btn ${activeView === 'admin_mesas' ? 'active' : ''}`}
            onClick={() => setActiveView('admin_mesas')}
          >
            Admin: Mesas
          </button>
          <button 
            className={`app-nav-btn ${activeView === 'admin_clientes' ? 'active' : ''}`}
            onClick={() => setActiveView('admin_clientes')}
          >
            Admin: Clientes
          </button>
        </nav>
        <div className="logout-btn-container">
          <button onClick={logout} className="btn btn-danger logout-btn">
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* --- 2. EL CONTENIDO PRINCIPAL (DERECHA) --- */}
      <main className="app-main-content">
        
        {/* --- ESTE ES EL DIV ENVOLTORIO --- */}
        <div className="app-content-wrapper">
          
          {activeView === 'home' && (
            <DashboardHome 
              username={user?.username || 'Admin'}
              onNavigate={(view) => setActiveView(view)}
            />
          )}
          
          {activeView === 'reservar' && (
            <ReservationForm 
              clients={clients} 
              tables={tables}
              businessHours={businessHours}
              onReservationSuccess={fetchClients}
            />
          )}
          {activeView === 'ver_reservas' && ( <ReservationManager /> )}
          {activeView === 'reportes' && ( <OccupancyReport /> )}
          {activeView === 'admin_mesas' && ( <TableManager tables={tables} onDataChange={fetchTables} /> )}
          {activeView === 'admin_clientes' && ( <ClientManager clients={clients} onDataChange={fetchClients} /> )}
        
        </div> {/* --- Cierre del div envoltorio --- */}
      </main>

      {/* Contenedor de Notificaciones */}
      {notification && (
        <NotificationToast
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}

export default App;