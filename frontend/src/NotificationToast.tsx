import React, { useEffect } from 'react';

interface NotificationToastProps {
  message: string;
  onClose: () => void; // Función para cerrarlo
}

function NotificationToast({ message, onClose }: NotificationToastProps) {
  
  // Cierra automáticamente después de 10 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 10000); // 10 segundos

    // Limpia el temporizador si el componente se desmonta
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={styles.toast}>
      <strong style={styles.title}>🔔 ¡Recordatorio de Reserva!</strong>
      <p style={styles.message}>{message}</p>
      <button onClick={onClose} style={styles.closeButton}>&times;</button>
    </div>
  );
}

// --- Estilos del Toast (en línea para simplicidad) ---
const styles: { [key: string]: React.CSSProperties } = {
  toast: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: 'var(--accent-primary)',
    color: 'var(--bg-primary)',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 0 25px rgba(0, 230, 118, 0.5)',
    zIndex: 2000,
    maxWidth: '350px',
    animation: 'slideIn 0.5s ease'
  },
  title: {
    fontSize: '1.2em',
    display: 'block',
    marginBottom: '5px'
  },
  message: {
    margin: 0
  },
  closeButton: {
    position: 'absolute',
    top: '5px',
    right: '10px',
    background: 'none',
    border: 'none',
    color: 'var(--bg-primary)',
    fontSize: '1.5em',
    cursor: 'pointer',
    opacity: 0.7
  }
};

// --- Añadir animación al CSS ---
// (Puedes añadir esto a tu 'index.css' si prefieres)
const keyframes = `
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
`;
// Inyectamos la animación en el <head>
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = keyframes;
document.head.appendChild(styleSheet);


export default NotificationToast;