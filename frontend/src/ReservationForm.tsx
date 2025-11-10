import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// --- Interfaces Locales ---
interface Client { id: number; name: string; phone: string; email: string | null; }
interface Table { id: number; table_number: number; capacity: number; location: string | null; }
interface BusinessHours {
  day_of_week: number;
  open_time: string;
  close_time: string;
}

// --- Props ---
interface ReservationFormProps {
  clients: Client[];
  tables: Table[];
  businessHours: BusinessHours[];
  onReservationSuccess: () => void; // <-- NUEVA PROP
}

// --- Funciones de Fecha (Helpers) ---
const getMinBookingLimit = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 120);
  return now;
};
const parseTime = (date: Date, timeString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
};
const isSameDay = (date1: Date, date2: Date) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};
// --- Fin de Helpers ---


function ReservationForm({ clients, tables, businessHours, onReservationSuccess }: ReservationFormProps) { // <-- PROP AÑADIDA
  
  // --- Estados ---
  const [formData, setFormData] = useState({
    client_id: '',
    table_id: '',
    party_size: '',
    start_time: null as Date | null,
  });
  const [message, setMessage] = useState({ type: '', content: '' });
  const [minBookingLimit, setMinBookingLimit] = useState(getMinBookingLimit());
  const [dynamicMinTime, setDynamicMinTime] = useState<Date | null>(null);
  const [dynamicMaxTime, setDynamicMaxTime] = useState<Date | null>(null);

  
  // Lógica de tiempo
  const handleTimeLogic = (date: Date) => {
    if (businessHours.length === 0) return; 
    const day = date.getDay();
    const schedule = businessHours.find(h => h.day_of_week === day);
    if (schedule) {
      const openTime = parseTime(date, schedule.open_time);
      const closeTime = parseTime(date, schedule.close_time);
      let finalMinTime = openTime;
      const nowWithMargin = getMinBookingLimit();
      if (isSameDay(date, nowWithMargin)) {
        finalMinTime = new Date(
          Math.max(openTime.getTime(), nowWithMargin.getTime())
        );
      }
      setDynamicMinTime(finalMinTime);
      setDynamicMaxTime(closeTime);
    } else {
      setDynamicMinTime(parseTime(date, "23:59"));
      setDynamicMaxTime(parseTime(date, "00:00"));
    }
  };

  // Carga inicial de tiempos
  useEffect(() => {
    handleTimeLogic(minBookingLimit); 
  }, [businessHours]);
  

  // Manejador de inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Manejador de Fecha
  const handleDateChange = (date: Date | null) => {
    setFormData(prevState => ({ ...prevState, start_time: date }));
    if (date) {
      handleTimeLogic(date);
    }
  };

  // Filtro de Días
  const isDayOpen = (date: Date) => {
    const day = date.getDay();
    const isOpen = businessHours.some(hour => hour.day_of_week === day);
    return isOpen;
  };

  // Envío del formulario
  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', content: '' });

    if (!formData.client_id || !formData.table_id || !formData.party_size || !formData.start_time) {
      setMessage({ type: 'error', content: 'Todos los campos son obligatorios.' });
      return;
    }
    try {
      const response = await axios.post('http://localhost:5000/api/reservations', {
        client_id: parseInt(formData.client_id),
        table_id: parseInt(formData.table_id),
        party_size: parseInt(formData.party_size),
        start_time: formData.start_time.toISOString(),
      });
      setMessage({ type: 'success', content: `¡Reserva creada exitosamente! (ID: ${response.data.id})` });
      setFormData({ client_id: '', table_id: '', party_size: '', start_time: null });
      
      // --- ============================ ---
      // --- ¡LÍNEA MÁGICA AÑADIDA! ---
      // --- ============================ ---
      // Llama a la función del padre (App.tsx) para recargar la lista de clientes
      onReservationSuccess(); 
      // --- ============================ ---

    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setMessage({ type: 'error', content: `Error: ${error.response.data.error}` });
      } else {
        setMessage({ type: 'error', content: 'Error desconocido al crear la reserva.' });
      }
    }
  };

  return (
    <div className="card reservation-form-card" style={{ maxWidth: '800px', margin: 'auto' }}>
      <h1>Crear Nueva Reserva</h1>
      
      <form onSubmit={handleCreateReservation}>
        <div className="form-group">
          <label htmlFor="client_id">Cliente:</label>
          <select id="client_id" name="client_id" value={formData.client_id} onChange={handleInputChange} required>
            <option value="" disabled>-- Seleccione un cliente --</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name} (ID: {client.id})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="table_id">Mesa:</label>
          <select id="table_id" name="table_id" value={formData.table_id} onChange={handleInputChange} required>
            <option value="" disabled>-- Seleccione una mesa --</option>
            {tables.map(table => (
              <option key={table.id} value={table.id}>
                Mesa #{table.table_number} (Capacidad: {table.capacity})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="party_size">Personas:</label>
          <input
            type="number"
            id="party_size"
            name="party_size"
            value={formData.party_size}
            onChange={handleInputChange}
            placeholder="Número de personas"
            min="1"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="start_time">Fecha y Hora:</label>
          <DatePicker
            id="start_time"
            selected={formData.start_time}
            onChange={handleDateChange}    
            filterDate={isDayOpen}          
            showTimeSelect
            minDate={minBookingLimit}
            minTime={dynamicMinTime}
            maxTime={dynamicMaxTime}
            timeIntervals={30}
            dateFormat="dd/MM/yyyy h:mm aa"
            placeholderText="Seleccione fecha y hora"
            required
            autoComplete="off"
            wrapperClassName="datepicker-wrapper"
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Crear Reserva</button>
      </form>

      {message.content && (
        <p className={message.type === 'error' ? 'message-error' : 'message-success'}>
          {message.content}
        </p>
      )}
    </div>
  );
}

export default ReservationForm;