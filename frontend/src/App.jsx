import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Importamos axios
import './App.css'; // Puedes borrar el CSS por defecto si quieres

function App() {
  // Estado para guardar el mensaje del backend
  const [message, setMessage] = useState('Cargando...');

  // useEffect se ejecuta cuando el componente se monta
  useEffect(() => {
    // Hacemos la petición GET a nuestro backend
    // Asegúrate que el puerto (5000) coincida con tu backend
    axios.get('http://localhost:5000/api/test')
      .then(response => {
        // Si todo sale bien, guardamos el mensaje
        setMessage(response.data.message);
      })
      .catch(error => {
        // Si hay un error (ej. el backend no está corriendo)
        console.error('Error al conectar con el backend:', error);
        setMessage('Error: No se pudo conectar al backend.');
      });
  }, []); // El array vacío [] significa que esto se ejecuta solo una vez

  return (
    <div className="App">
      <header className="App-header">
        <h1>Proyecto de Reservas</h1>

        {/* Aquí mostramos el mensaje que recibimos del backend */}
        <h2>Estado de la Conexión:</h2>
        <p style={{ color: 'lightgreen', fontStyle: 'italic' }}>
          {message}
        </p>
      </header>
    </div>
  );
}

export default App;