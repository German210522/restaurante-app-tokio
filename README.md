🍜 Sistema de Reservas "Tokio Bakery"
Este es un sistema completo de gestión de reservas full-stack, construido con el stack MERN (aunque usamos PostgreSQL en lugar de Mongo) y TypeScript.

El proyecto está estructurado como un monorepo con dos carpetas principales:

/backend: La API del servidor (Node.js, Express, Prisma, PostgreSQL).

/frontend: La aplicación del cliente (React, Vite, TypeScript, Socket.io-client).

🚀 Prerrequisitos
Para ejecutar este proyecto, necesitarás tener instalado el siguiente software:

Node.js (v18 o superior)

Git

Un servidor de PostgreSQL (base de datos)

Una herramienta de API (como Postman o Thunder Client) para la configuración inicial.

⚙️ 1. Configuración del Backend (Servidor)
Clonar el Repositorio:

Bash

git clone https://github.com/tu-usuario/restaurante-app-tokio.git
cd restaurante-app-tokio
Navegar al Backend e Instalar Dependencias:

Bash

cd backend
npm install
Configurar la Base de Datos y el Entorno:

Asegúrate de que tu servidor PostgreSQL esté corriendo.

Crea una nueva base de datos (ej. tokio_reservas).

En la carpeta /backend, crea un archivo llamado .env (puedes copiar backend/.env.example si existe, o usar esta plantilla).

Añade tu URL de conexión de PostgreSQL al archivo .env:

.env

Fragmento de código

# Reemplaza 'usuario', 'contraseña' y 'tokio_reservas' con tus datos
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/tokio_reservas?schema=public"
Ejecutar la Migración de la Base de Datos:

Este comando leerá el archivo prisma/schema.prisma y creará automáticamente todas las tablas (User, Client, Table, Reservation, BusinessHours) en tu base de datos.

Bash

npx prisma migrate dev
Iniciar el Servidor Backend:

Bash

npm run dev
El servidor ahora estará corriendo en http://localhost:5000.

La terminal también mostrará tus credenciales de prueba de Ethereal Email para ver los correos de confirmación.

🎨 2. Configuración del Frontend (Cliente)
Abre una nueva terminal.

Navega a la carpeta /frontend (desde la raíz del proyecto):

Bash

# (Si estás en /backend)
cd ../frontend

# (Si estás en la raíz)
cd frontend
Instalar Dependencias:

Bash

npm install
Iniciar la Aplicación React:

Bash

npm run dev
Tu aplicación ahora estará corriendo en http://localhost:5173.

🔑 3. Configuración Inicial (¡Importante!)
Tu aplicación está corriendo, pero la base de datos está vacía. Debes realizar dos configuraciones iniciales usando una herramienta de API (como Thunder Client) para que el sistema funcione.

A. Registrar tu Cuenta de Administrador
Método: POST

URL: http://localhost:5000/api/auth/register

Body (JSON):

JSON

{
  "username": "admin",
  "password": "misuperpassword123"
}
(Puedes cambiar "admin" y "misuperpassword123" por lo que quieras).

B. Establecer los Horarios de Negocio
El calendario de reservas no mostrará ningún día como "abierto" hasta que definas los horarios. Debes ejecutar esta petición para cada día que el restaurante esté abierto (cambiando day_of_week y los horarios).

(day_of_week: 0 = Domingo, 1 = Lunes, 2 = Martes, ..., 6 = Sábado)

Método: POST

URL: http://localhost:5000/api/auth/login (Obtén tu token de admin primero).

Método: POST

URL: http://localhost:5000/api/hours

Headers: Añade tu token (Authorization: Bearer tu-token-jwt...).

Body (JSON) - Ejemplo para Lunes:

JSON

{
  "day_of_week": 1,
  "open_time": "09:00",
  "close_time": "22:00"
}
Repite este paso para todos los días necesarios (ej. 2, 3, 4, 5, 6).

¡Listo!
Ahora puedes ir a http://localhost:5173, iniciar sesión como "admin", y tu sistema estará 100% funcional.
