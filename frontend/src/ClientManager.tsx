import React, { useState } from 'react';
import axios from 'axios';

// --- Interfaces locales ---
interface Client {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  loyalty_points: number;
}
interface ClientFormData {
  name: string;
  phone: string;
  email: string;
}
interface ClientReservation {
  id: number;
  start_time: string;
  party_size: number;
  status: string;
  table: { table_number: number };
  points_earned: number; // <-- AÑADIDO
}
interface ClientManagerProps {
  clients: Client[];
  onDataChange: () => void;
}
// --- Fin de Interfaces ---

const API_URL = 'http://localhost:5000/api/clients';

function ClientManager({ clients, onDataChange }: ClientManagerProps) {
  // ... (Estados sin cambios)
  const [newClient, setNewClient] = useState<ClientFormData>({
    name: '', phone: '', email: ''
  });
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<ClientFormData>({
    name: '', phone: '', email: ''
  });
  const [clientHistory, setClientHistory] = useState<ClientReservation[]>([]);
  const [viewingHistoryFor, setViewingHistoryFor] = useState<Client | null>(null);

  // ... (Funciones CRUD sin cambios)
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.phone) {
      alert('Nombre y teléfono son obligatorios');
      return;
    }
    try {
      await axios.post(API_URL, newClient);
      setNewClient({ name: '', phone: '', email: '' });
      onDataChange();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        alert(`Error: ${error.response.data.error}`);
      }
    }
  };
  const handleDeleteClient = async (id: number) => {
    if (!window.confirm(`¿Estás seguro de que quieres borrar al cliente ID: ${id}?`)) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/${id}`);
      onDataChange();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        alert(`Error: ${error.response.data.error}`);
      }
    }
  };
  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClientId) return;
    try {
      await axios.put(`${API_URL}/${editingClientId}`, editFormData);
      setEditingClientId(null);
      onDataChange();
      alert('Cliente actualizado exitosamente.');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        alert(`Error: ${error.response.data.error}`);
      }
    }
  };
  
  // ... (Funciones de Historial y Forms sin cambios)
  const handleViewHistory = async (client: Client) => {
    try {
      const response = await axios.get(`${API_URL}/${client.id}/reservations`);
      setClientHistory(response.data);
      setViewingHistoryFor(client);
    } catch (error) {
      alert('Error al cargar el historial de este cliente.');
    }
  };
  const handleCloseHistory = () => {
    setViewingHistoryFor(null);
    setClientHistory([]);
  };
  const handleEditClick = (client: Client) => {
    setEditingClientId(client.id);
    setEditFormData({
      name: client.name, phone: client.phone, email: client.email || ''
    });
  };
  const handleCancelEdit = () => setEditingClientId(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewClient(prevState => ({ ...prevState, [name]: value }));
  };
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prevState => ({ ...prevState, [name]: value }));
  };
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="card" style={{ borderColor: 'var(--accent-info)' }}>
      
      {viewingHistoryFor ? (
        // --- VISTA DE HISTORIAL (Modificada) ---
        <div className="history-view">
          <h2>Historial de: {viewingHistoryFor.name}</h2>
          <h3 style={{color: 'var(--text-secondary)'}}>Total de Puntos: {viewingHistoryFor.loyalty_points || 0}</h3>
          <button onClick={handleCloseHistory} className="btn btn-secondary">&larr; Volver</button>
          
          <ul className="list" style={{ marginTop: '20px' }}>
            {clientHistory.length === 0 ? (
              <p>Este cliente no tiene reservas en su historial.</p>
            ) : (
              clientHistory.map(res => (
                <li key={res.id} className="list-item">
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <strong className={res.status === 'cancelled' ? 'status-cancelled' : 'status-confirmed'}>
                      {res.status.toUpperCase()}
                    </strong>
                    {/* --- AÑADIDO: Muestra los puntos --- */}
                    {res.points_earned > 0 && (
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                        +{res.points_earned} Puntos
                      </span>
                    )}
                  </div>
                  <p>Fecha: {formatDateTime(res.start_time)}</p>
                  <p>Mesa: #{res.table.table_number} (Para {res.party_size})</p>
                </li>
              ))
            )}
          </ul>
        </div>

      ) : (

        // --- VISTA DE GESTIÓN (Sin cambios) ---
        <div>
          <h1>Gestión de Clientes</h1>
          
          <h2>Registrar Nuevo Cliente</h2>
          <form onSubmit={handleCreateClient}>
            {/* ... (Formulario de creación sin cambios) ... */}
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text" name="name" value={newClient.name}
                onChange={handleInputChange} placeholder="Nombre Completo" required
              />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="tel" name="phone" value={newClient.phone}
                onChange={handleInputChange} placeholder="Teléfono" required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email" name="email" value={newClient.email}
                onChange={handleInputChange} placeholder="Email (Opcional)"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Registrar Cliente</button>
          </form>

          <hr style={{ margin: '20px 0', borderColor: '#333' }} />

          <h2>Clientes Registrados</h2>
          <ul className="list">
            {clients.map(client => (
              <li key={client.id} className="list-item">
                
                {editingClientId === client.id ? (
                  <form onSubmit={handleUpdateClient}>
                    {/* ... (Formulario de edición sin cambios) ... */}
                    <div className="form-group">
                      <label>Nombre</label>
                      <input
                        type="text" name="name" value={editFormData.name}
                        onChange={handleEditFormChange} required
                      />
                    </div>
                    <div className="form-group">
                      <label>Teléfono</label>
                      <input
                        type="tel" name="phone" value={editFormData.phone}
                        onChange={handleEditFormChange} required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email" name="email" value={editFormData.email}
                        onChange={handleEditFormChange}
                      />
                    </div>
                    <button type="submit" className="btn btn-success">Guardar</button>
                    <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>Cancelar</button>
                  </form>
                ) : (
                  <div>
                    <strong>{client.name}</strong>
                    <p>ID: {client.id} | Tel: {client.phone} | Puntos: {client.loyalty_points || 0}</p>
                    <p>Email: {client.email || 'N/A'}</p>
                    <button onClick={() => handleEditClick(client)} className="btn btn-warning">
                      Editar
                    </button>
                    <button onClick={() => handleDeleteClient(client.id)} className="btn btn-danger">
                      Borrar
                    </button>
                    <button onClick={() => handleViewHistory(client)} className="btn btn-info">
                      Ver Historial
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ClientManager;