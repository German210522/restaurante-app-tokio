import React, { useState } from 'react';
import axios from 'axios';
// import { Table } from './App'; // <-- LÍNEA ELIMINADA

// --- NUEVO: Interfaces locales ---
interface Table {
  id: number;
  table_number: number;
  capacity: number;
  location: string | null;
}
interface TableFormData {
  table_number: string;
  capacity: string;
  location: string;
}
interface TableManagerProps {
  tables: Table[];
  onDataChange: () => void;
}
// --- FIN DE NUEVO ---

const API_URL = 'http://localhost:5000/api/tables';

function TableManager({ tables, onDataChange }: TableManagerProps) {
  // --- Estados ---
  const [newTable, setNewTable] = useState<TableFormData>({
    table_number: '', capacity: '', location: ''
  });
  const [editingTableId, setEditingTableId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<TableFormData>({
    table_number: '', capacity: '', location: ''
  });
  const [tableNumberError, setTableNumberError] = useState<string>('');

  // --- Funciones CRUD ---
  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tableNumberError) {
      alert('Corrija los errores antes de crear la mesa.');
      return;
    }
    if (!newTable.table_number || !newTable.capacity) {
      alert('Número de mesa y capacidad son obligatorios');
      return;
    }
    try {
      await axios.post(API_URL, {
        ...newTable,
        table_number: parseInt(newTable.table_number),
        capacity: parseInt(newTable.capacity)
      });
      setNewTable({ table_number: '', capacity: '', location: '' });
      onDataChange();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        alert(`Error del servidor: ${error.response.data.error}`);
      }
    }
  };

  const handleDeleteTable = async (id: number) => {
    if (!window.confirm(`¿Estás seguro de que quieres borrar la mesa ID: ${id}?`)) {
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

  const handleUpdateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTableId) return;
    try {
      await axios.put(`${API_URL}/${editingTableId}`, {
        ...editFormData,
        table_number: parseInt(editFormData.table_number),
        capacity: parseInt(editFormData.capacity)
      });
      setEditingTableId(null);
      onDataChange();
      alert('Mesa actualizada exitosamente.');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        alert(`Error: ${error.response.data.error}`);
      }
    }
  };

  // --- Funciones de Form ---
  const handleEditClick = (table: Table) => {
    setEditingTableId(table.id);
    setEditFormData({
      table_number: String(table.table_number),
      capacity: String(table.capacity),
      location: table.location || ''
    });
  };
  const handleCancelEdit = () => setEditingTableId(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTable(prevState => ({ ...prevState, [name]: value }));
  };

  // Validación de número de mesa
  const validateTableNumber = () => {
    if (!newTable.table_number) {
      setTableNumberError('');
      return;
    }
    const exists = tables.some(
      table => table.table_number === parseInt(newTable.table_number)
    );
    if (exists) {
      setTableNumberError('Error: Este número de mesa ya existe.');
    } else {
      setTableNumberError('');
    }
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prevState => ({ ...prevState, [name]: value }));
  };

  return (
    <div className="card">
      <h2>Gestión de Mesas</h2>
      <form onSubmit={handleCreateTable}>
        <div className="form-group">
          <label>Número de Mesa</label>
          <input
            type="number" 
            name="table_number" 
            value={newTable.table_number}
            onChange={handleInputChange}
            onBlur={validateTableNumber}
            placeholder="Número de Mesa" 
            required
            style={tableNumberError ? { borderColor: 'var(--accent-danger)' } : {}}
          />
          {tableNumberError && (
            <p className="message-error" style={{ marginTop: '5px', marginBottom: 0 }}>
              {tableNumberError}
            </p>
          )}
        </div>
        <div className="form-group">
          <label>Capacidad</label>
          <input
            type="number" name="capacity" value={newTable.capacity}
            onChange={handleInputChange} placeholder="Capacidad" required
          />
        </div>
        <div className="form-group">
          <label>Ubicación</label>
          <input
            type="text" name="location" value={newTable.location}
            onChange={handleInputChange} placeholder="Ej. Terraza"
          />
        </div>
        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{width: '100%'}}
          disabled={!!tableNumberError}
        >
          Crear Mesa
        </button>
      </form>

      <hr style={{ margin: '20px 0', borderColor: '#333' }} />

      <h2>Mesas Registradas</h2>
      <ul className="list">
        {tables.map(table => (
          <li key={table.id} className="list-item">
            {editingTableId === table.id ? (
              <form onSubmit={handleUpdateTable}>
                {/* ... (Formulario de edición sin cambios) ... */}
                <div className="form-group">
                  <label>Número</label>
                  <input
                    type="number" name="table_number" value={editFormData.table_number}
                    onChange={handleEditFormChange} required
                  />
                </div>
                <div className="form-group">
                  <label>Capacidad</label>
                  <input
                    type="number" name="capacity" value={editFormData.capacity}
                    onChange={handleEditFormChange} required
                  />
                </div>
                <div className="form-group">
                  <label>Ubicación</label>
                  <input
                    type="text" name="location" value={editFormData.location}
                    onChange={handleEditFormChange}
                  />
                </div>
                <button type="submit" className="btn btn-success">Guardar</button>
                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>Cancelar</button>
              </form>
            ) : (
              <div>
                <strong>Mesa #{table.table_number}</strong>
                <p>ID: {table.id} | Capacidad: {table.capacity} | Ubicación: {table.location || 'N/A'}</p>
                <button onClick={() => handleEditClick(table)} className="btn btn-warning">
                  Editar
                </button>
                <button onClick={() => handleDeleteTable(table.id)} className="btn btn-danger">
                  Borrar
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TableManager;