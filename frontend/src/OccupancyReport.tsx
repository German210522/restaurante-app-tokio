import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './chartSetup'; // Carga el registro del gráfico
import { Bar } from 'react-chartjs-2';

// Interface para los datos del reporte
interface ReportData {
  day: string;
  people: number;
}

const API_URL = 'http://localhost:5000/api/reports/occupancy-by-day';

// --- DEFINIR COLORES DIRECTAMENTE PARA EL GRÁFICO ---
// Los valores de tu archivo index.css:
const TOKIO_BEIGE = '#e5d8cf';        // Color de "Reporte de Ocupación"
const TOKIO_BEIGE_TRANS = 'rgba(229, 216, 207, 0.6)'; // El mismo color, con transparencia
const TEXT_PRIMARY_COLOR = '#e0e0e0'; // Blanco/claro para los ejes
const BG_INPUT_COLOR = '#3e3834';    // Para las líneas de la cuadrícula
const BG_PRIMARY_COLOR = '#211e1c';  // Para ocultar la cuadrícula X

function OccupancyReport() {
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await axios.get(API_URL);
        setReportData(response.data);
      } catch (err) {
        console.error("Error al cargar reporte:", err);
        setError('No se pudo cargar el reporte.');
      }
    };
    fetchReport();
  }, []);

  // --- Configuración del Gráfico (Paleta TOKIO BAKERY) ---
  const chartData = {
    labels: reportData.map(d => d.day), // Eje X
    datasets: [
      {
        label: 'Total de Personas Atendidas',
        data: reportData.map(d => d.people), // Eje Y
        
        // --- ============================ ---
        // ---   COLORES DE BARRA (Beige)   ---
        // --- ============================ ---
        backgroundColor: TOKIO_BEIGE_TRANS, // Beige con transparencia
        borderColor: TOKIO_BEIGE,       // Beige sólido
        // --- ============================ ---

        borderWidth: 2,
        borderRadius: 5,
        hoverBackgroundColor: TOKIO_BEIGE, // Beige sólido al pasar el ratón
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          // --- LETRAS (Beige) ---
          color: TOKIO_BEIGE, 
          font: { size: 14 }
        }
      },
      title: {
        display: true,
        text: 'Ocupación Total por Día de la Semana',
        // --- LETRAS (Beige) ---
        color: TOKIO_BEIGE, 
        font: { size: 18 }
      },
    },
    scales: { 
      y: {
        beginAtZero: true,
        ticks: { color: TEXT_PRIMARY_COLOR }, // Letras Blancas
        grid: { color: BG_INPUT_COLOR } 
      },
      x: {
        ticks: { color: TEXT_PRIMARY_COLOR }, // Letras Blancas
        grid: { color: BG_PRIMARY_COLOR } 
      }
    }
  };
  // --- Fin de Configuración ---


  return (
    <div className="card" style={{ minHeight: '500px' }}>
      <h1>Reporte de Ocupación</h1> 
      {error && <p className="message-error">{error}</p>}
      <div style={{ position: 'relative', height: '400px' }}>
        {reportData.length > 0 ? (
          <Bar options={chartOptions} data={chartData} />
        ) : (
          <p>Cargando datos del reporte...</p>
        )}
      </div>
    </div>
  );
} 

export default OccupancyReport;