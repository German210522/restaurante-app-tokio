import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Interfaces
interface Reservation {
  id: number;
  start_time: string;
  party_size: number;
  status: string;
  client: { id: number; name: string; };
  table: { id: number; table_number: number; };
  archived_at?: string | null;
}
interface GroupedReservations {
  [dateHeader: string]: Reservation[];
}

const API_URL = 'http://localhost:5000/api/reservations';

function ReservationManager() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [message, setMessage] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [archivedReservations, setArchivedReservations] = useState<Reservation[]>([]);

  const fetchReservations = async () => {
    try {
      const response = await axios.get(API_URL);
      setReservations(response.data);
    } catch (error) {
      console.error('Error al obtener las reservas:', error);
      setMessage('Error al cargar las reservas.');
    }
  };
  
  useEffect(() => {
    fetchReservations();
  }, []);

  const handleFetchArchived = async () => {
    try {
      const response = await axios.get(`${API_URL}/archived`);
      setArchivedReservations(response.data);
      setShowArchived(true);
      setMessage('');
    } catch (error) {
      console.error('Error al obtener reservas archivadas:', error);
      setMessage('Error al cargar el archivo.');
    }
  };

  const handleShowMainView = () => {
    setShowArchived(false);
    fetchReservations();
  };

  const handleCancelReservation = async (id: number) => {
    if (!window.confirm(`¿Estás seguro de que quieres CANCELAR la reserva ID: ${id}?`)) return;
    try {
      await axios.put(`${API_URL}/${id}/cancel`);
      setMessage('Reserva cancelada exitosamente.');
      fetchReservations();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setMessage(`Error: ${error.response.data.error}`);
      }
    }
  };
  
  // --- ============================ ---
  // --- NUEVA FUNCIÓN: CHECK-IN ---
  // --- ============================ ---
  const handleCheckIn = async (id: number) => {
    if (!window.confirm(`¿Confirmar llegada (Check-In) para la reserva ID: ${id}?`)) return;
    try {
      // 1. Llama al nuevo endpoint
      await axios.put(`${API_URL}/${id}/check-in`);
      setMessage('✅ Cliente marcado como "Sentado" (Check-In).');
      // 2. Refresca la lista
      fetchReservations();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setMessage(`Error: ${error.response.data.error}`);
      }
    }
  };

  const handleCleanCanceled = async () => {
    if (!window.confirm("ADVERTENCIA: ¿Estás seguro de que deseas mover las reservas canceladas al archivo (retención de 4 horas)? Las reservas antiguas se ELIMINARÁN PERMANENTEMENTE.")) return;
    try {
      const response = await axios.delete(`${API_URL}/cancelled`);
      const archivedCount = response.data.archived_count;
      const deletedCount = response.data.deleted_count;
      setMessage(`✅ Proceso completado: ${archivedCount} reservas se archivaron y ${deletedCount} antiguas se eliminaron.`);
      fetchReservations(); 
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setMessage(`Error: ${error.response.data.error}`);
      } else {
        setMessage('Error al intentar limpiar la base de datos.');
      }
    }
  };

  // --- Funciones de Formato (sin cambios) ---
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  const formatDateHeader = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  const isToday = (someDate: Date) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
           someDate.getMonth() === today.getMonth() &&
           someDate.getFullYear() === today.getFullYear();
  };
  
  // --- Lógica de Filtrado (sin cambios) ---
  const todayReservations = reservations.filter(res => isToday(new Date(res.start_time)));
  const futureReservations = reservations.filter(res => !isToday(new Date(res.start_time)));
  const groupedFutureReservations = futureReservations
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .reduce((acc, res) => {
      const dateKey = formatDateHeader(res.start_time);
      if (!acc[dateKey]) { acc[dateKey] = []; }
      acc[dateKey].push(res);
      return acc;
    }, {} as GroupedReservations);

  // --- Función Helper para el Título ---
  // Define el estilo del título (CONFIRMED, CANCELLED, SEATED)
  const getStatusClass = (status: string) => {
    if (status === 'cancelled') return 'status-cancelled';
    if (status === 'seated') return 'status-seated';
    return 'status-confirmed';
  };


  // --- Renderizado (HTML) ---
  return (
    <div className="card" style={{ borderColor: 'var(--accent-warn)', maxWidth: '800px', margin: 'auto' }}>
      <h1>Gestión de Reservas</h1>
      {message && <p className={message.startsWith('✅') ? 'message-success' : 'message-error'}>{message}</p>}
      
      {showArchived ? (
        
        // --- VISTA 2: ARCHIVO ---
        <div>
          <button onClick={handleShowMainView} className="btn btn-secondary">
            &larr; Volver a Reservas Activas
          </button>
          <h2 className="archive-header" style={{ marginTop: '30px' }}>
            Reservas Archivadas (Retenidas por 15 Minutos)
          </h2>
          <ul className="list">
            {archivedReservations.length === 0 && (
              <p>El archivo está vacío.</p>
            )}
            {archivedReservations
              .sort((a, b) => new Date(b.archived_at!).getTime() - new Date(a.archived_at!).getTime()) // <-- Ordena por fecha de archivo
              .map(res => (
              <li key={res.id} className="list-item archive-item">
                <strong>
                  ARCHIVED (ID: {res.id})
                </strong>
                <p><strong>Cliente:</strong> {res.client.name} (ID: {res.client.id})</p>
                <p><strong>Fecha Reserva:</strong> {formatDateTime(res.start_time)}</p>
                <p><strong>Archivado en:</strong> {res.archived_at ? formatDateTime(res.archived_at) : 'N/A'}</p>
              </li>
            ))}
          </ul>
        </div>

      ) : (

        // --- VISTA 1: PRINCIPAL (Hoy y Próximas) ---
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button onClick={fetchReservations} className="btn btn-secondary">
                Refrescar Lista
              </button>
              <button onClick={handleCleanCanceled} className="btn btn-danger">
                Limpiar Canceladas
              </button>
              <button onClick={handleFetchArchived} className="btn btn-warning">
                Ver Archivo
              </button>
          </div>

          {/* Sección HOY */}
          <h2 style={{ color: 'var(--accent-primary)', marginTop: '30px' }}>
            Reservas para Hoy
          </h2>
          <ul className="list">
            {reservations.length === 0 && <p>No hay reservas para mostrar.</p>}
            {reservations.length > 0 && todayReservations.length === 0 && (
              <p>No hay reservas para hoy.</p>
            )}
            {todayReservations
              .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
              .map(res => (
                <li key={res.id} className="list-item">
                  <strong className={getStatusClass(res.status)}> {/* <-- Lógica de clase actualizada */}
                    {res.status.toUpperCase()} (ID: {res.id})
                  </strong>
                  <p><strong>Cliente:</strong> {res.client.name} (ID: {res.client.id})</p>
                  <p><strong>Mesa:</strong> #{res.table.table_number} (Para {res.party_size} personas)</p>
                  <p><strong>Hora:</strong> {formatDateTime(res.start_time)}</p>
                  
                  {/* --- BOTONES CONDICIONALES --- */}
                  {res.status === 'confirmed' && (
                    <div style={{marginTop: '10px'}}>
                      <button onClick={() => handleCheckIn(res.id)} className="btn btn-success">
                        Marcar Llegada (Check-In)
                      </button>
                      <button onClick={() => handleCancelReservation(res.id)} className="btn btn-danger">
                        Cancelar Reserva
                      </button>
                    </div>
                  )}
                </li>
              ))
            }
          </ul>

          <hr style={{ margin: '30px 0', borderColor: '#333' }} />

          {/* Sección PRÓXIMAS */}
          <h2 style={{ color: 'var(--text-secondary)' }}>
            Próximas Reservas
          </h2>
          <ul className="list">
            {reservations.length > 0 && futureReservations.length === 0 && (
              <p>No hay reservas futuras programadas.</p>
            )}
            {Object.entries(groupedFutureReservations).map(([dateHeader, reservationsForDay]) => (
              <li key={dateHeader} className="list-item date-group-item">
                <h3 className="date-group-header">{dateHeader}</h3>
                <ul className="list inner-list">
                  {reservationsForDay.map(res => (
                    <li key={res.id} className="list-item" style={{borderColor: '#555'}}>
                      <strong className={getStatusClass(res.status)}> {/* <-- Lógica de clase actualizada */}
                        {res.status.toUpperCase()} (ID: {res.id})
                      </strong>
                      <p><strong>Cliente:</strong> {res.client.name} (ID: {res.client.id})</p>
                      <p><strong>Mesa:</strong> #{res.table.table_number} (Para {res.party_size} personas)</p>
                      <p><strong>Hora:</strong> {formatDateTime(res.start_time)}</p>
                      {/* --- BOTONES CONDICIONALES --- */}
                      {res.status === 'confirmed' && (
                        <div style={{marginTop: '10px'}}>
                          <button onClick={() => handleCheckIn(res.id)} className="btn btn-success">
                            Marcar Llegada (Check-In)
                          </button>
                          <button onClick={() => handleCancelReservation(res.id)} className="btn btn-danger">
                            Cancelar Reserva
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ReservationManager;