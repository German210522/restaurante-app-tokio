import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- Interfaces ---
interface DashboardStats {
  totalClients: number;
  totalTables: number;
  todayReservations: number;
  upcomingReservations: number;
}
interface TopClient {
  name: string;
  loyalty_points: number;
}

interface DashboardHomeProps {
  onNavigate: (view: 'reservar' | 'ver_reservas' | 'reportes') => void;
  username: string;
}

const STATS_API_URL = 'http://localhost:5000/api/dashboard/stats';
const TOP_CLIENT_API_URL = 'http://localhost:5000/api/reports/top-client';

function DashboardHome({ onNavigate, username }: DashboardHomeProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');
  const [topClient, setTopClient] = useState<TopClient | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(STATS_API_URL);
        setStats(response.data);
      } catch (err) {
        console.error("Error al cargar estadísticas:", err);
        setError('No se pudieron cargar las estadísticas.');
      }
    };
    
    const fetchTopClient = async () => {
      try {
        const response = await axios.get(TOP_CLIENT_API_URL);
        setTopClient(response.data);
      } catch (err) {
        console.error("Error al cargar cliente destacado:", err);
      }
    };

    fetchStats();
    fetchTopClient();
  }, []);

  return (
    <div className="dashboard-home">
      
      {/* --- ============================ --- */}
      {/* --- ESTRUCTURA DE HEADER MODIFICADA --- */}
      {/* --- ============================ --- */}
      <div className="dashboard-header-flex">
        
        {/* 1. Texto de Bienvenida */}
        <div className="header-text">
          <h1>Bienvenido de nuevo, <span>{username}</span>.</h1>
          <p className="subtitle">Este es el resumen de tu restaurante.</p>
        </div>

        {/* 2. Cliente Destacado (Movido aquí) */}
        {topClient && (
          // Añadimos la clase 'small'
          <div className="highlight-card small"> 
            <div className="trophy">🏆</div>
            <div className="highlight-card-content">
              <h2>Cliente Destacado</h2>
              <h3>{topClient.name}</h3>
              <p>{topClient.loyalty_points} <span>puntos</span></p>
            </div>
          </div>
        )}
      </div>
      {/* --- FIN DE ESTRUCTURA FLEX --- */}


      {error && <p className="message-error">{error}</p>}

      {/* --- Tarjetas de Estadísticas (Ahora van después) --- */}
      <div className="stat-card-container">
        <div className="stat-card">
          <h3 className="stat-card-title">Reservas para Hoy</h3>
          <p className="stat-card-value">{stats ? stats.todayReservations : '...'}</p>
        </div>
        <div className="stat-card">
          <h3 className="stat-card-title">Próximas Reservas</h3>
          <p className="stat-card-value">{stats ? stats.upcomingReservations : '...'}</p>
        </div>
        <div className="stat-card">
          <h3 className="stat-card-title">Clientes Totales</h3>
          <p className="stat-card-value">{stats ? stats.totalClients : '...'}</p>
        </div>
        <div className="stat-card">
          <h3 className="stat-card-title">Total de Mesas</h3>
          <p className="stat-card-value">{stats ? stats.totalTables : '...'}</p>
        </div>
      </div>

      <hr style={{ margin: '40px 0', borderColor: '#333' }} />

      {/* --- Accesos Rápidos (Sin cambios) --- */}
      <h2>Accesos Rápidos</h2>
      <div className="quick-actions">
        <button className="quick-action-btn" onClick={() => onNavigate('reservar')}>
          + Crear Nueva Reserva
        </button>
        <button className="quick-action-btn" onClick={() => onNavigate('ver_reservas')}>
          Ver Reservas del Día
        </button>
        <button className="quick-action-btn" onClick={() => onNavigate('reportes')}>
          Ver Reportes
        </button>
      </div>
    </div>
  );
}

export default DashboardHome;