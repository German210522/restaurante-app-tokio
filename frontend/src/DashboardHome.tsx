import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Interface para las estadísticas
interface DashboardStats {
  totalClients: number;
  totalTables: number;
  todayReservations: number;
  upcomingReservations: number;
}

// Props para los botones de acción
interface DashboardHomeProps {
  onNavigate: (view: 'reservar' | 'ver_reservas' | 'reportes') => void;
  username: string;
}

const API_URL = 'http://localhost:5000/api/dashboard/stats';

function DashboardHome({ onNavigate, username }: DashboardHomeProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(API_URL);
        setStats(response.data);
      } catch (err) {
        console.error("Error al cargar estadísticas:", err);
        setError('No se pudieron cargar las estadísticas.');
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="dashboard-home">
      <h1>Bienvenido de nuevo, <span>{username}</span>.</h1>
      <p className="subtitle">Este es el resumen de tu restaurante.</p>

      {error && <p className="message-error">{error}</p>}

      {/* --- Tarjetas de Estadísticas --- */}
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

      {/* --- Botones de Acción Rápida --- */}
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