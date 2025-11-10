const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require("socket.io");
const cron = require('node-cron');
const { getDay, startOfDay, endOfDay } = require('date-fns');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');

// --- Constantes e Inicializaciones ---
const JWT_SECRET = 'micontraseñasecreta12345';
const prisma = new PrismaClient();
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 5000;

// --- Configuración de Nodemailer ---
let emailTransporter;
async function createTestTransporter() {
  try {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host, port: testAccount.smtp.port, secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('📬 Transportador de email (Ethereal) creado.');
    emailTransporter = transporter;
  } catch (error) { console.error("Error al crear la cuenta de Ethereal:", error); }
}
createTestTransporter();

// --- Middlewares Esenciales ---
app.use(cors());
app.use(express.json());

// --- Middleware de Autenticación ---
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next(); 
  } catch (error) {
    res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

// --- Ruta de Prueba ---
app.get('/api/test', (req, res) => {
  res.json({ message: '¡El backend está conectado y funcionando! 🚀' });
});

// --- ================================== ---
// ---       API GESTIÓN DE MESAS         ---
// --- ================================== ---

app.post('/api/tables', authMiddleware, async (req, res) => {
  try {
    const { table_number, capacity, location } = req.body;
    if (!table_number || !capacity) {
      return res.status(400).json({ error: 'El número de mesa y la capacidad son obligatorios.' });
    }
    const newTable = await prisma.table.create({
      data: {
        table_number: parseInt(table_number),
        capacity: parseInt(capacity),
        location: location,
      },
    });
    res.status(201).json(newTable);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe una mesa con ese número.' });
    }
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.get('/api/tables', async (req, res) => {
  try {
    const allTables = await prisma.table.findMany({
      orderBy: { table_number: 'asc' },
    });
    res.status(200).json(allTables);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.delete('/api/tables/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.table.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(200).json({ message: 'Mesa borrada exitosamente.' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Mesa no encontrada.' });
    }
    if (error.code === 'P2003') {
        return res.status(409).json({ error: 'No se puede borrar la mesa porque tiene reservas asociadas.' });
    }
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.put('/api/tables/:id', authMiddleware, async (req, res) => {
  try {
    const { table_number, capacity, location } = req.body;
    if (!table_number || !capacity) {
      return res.status(400).json({ error: 'El número de mesa y la capacidad son obligatorios.' });
    }
    const updatedTable = await prisma.table.update({
      where: { id: parseInt(req.params.id) },
      data: {
        table_number: parseInt(table_number),
        capacity: parseInt(capacity),
        location: location,
      },
    });
    res.status(200).json(updatedTable);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Mesa no encontrada.' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe otra mesa con ese número.' });
    }
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});


// --- ================================== ---
// ---       API GESTIÓN DE CLIENTES      ---
// --- ================================== ---

app.post('/api/clients', authMiddleware, async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'El nombre y el teléfono son obligatorios.' });
    }
    const newClient = await prisma.client.create({
      data: { name, phone, email },
    });
    res.status(201).json(newClient);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un cliente con ese número de teléfono.' });
    }
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.get('/api/clients', async (req, res) => {
  try {
    const allClients = await prisma.client.findMany({
      orderBy: { id: 'asc' },
    });
    res.status(200).json(allClients);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.put('/api/clients/:id', authMiddleware, async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'El nombre y el teléfono son obligatorios.' });
    }
    const updatedClient = await prisma.client.update({
      where: { id: parseInt(req.params.id) },
      data: { name, phone, email },
    });
    res.status(200).json(updatedClient);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe otro cliente con ese número de teléfono.' });
    }
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.delete('/api/clients/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.client.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(200).json({ message: 'Cliente borrado exitosamente.' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }
    if (error.code === 'P2003') {
      return res.status(409).json({ error: 'No se puede borrar el cliente porque tiene reservas asociadas.' });
    }
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});


// --- ================================== ---
// ---   API GESTIÓN DE HORARIOS ---
// --- ================================== ---

app.get('/api/hours', async (req, res) => {
  try {
    const hours = await prisma.businessHours.findMany({
      orderBy: { day_of_week: 'asc' },
    });
    res.status(200).json(hours);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.post('/api/hours', authMiddleware, async (req, res) => {
  try {
    const { day_of_week, open_time, close_time } = req.body;
    if (day_of_week === undefined || !open_time || !close_time) {
      return res.status(400).json({ error: 'Día, apertura y cierre son obligatorios.' });
    }
    const day = parseInt(day_of_week);
    const existingHour = await prisma.businessHours.findFirst({
      where: { day_of_week: day },
    });
    let savedHour;
    if (existingHour) {
      savedHour = await prisma.businessHours.update({
        where: { id: existingHour.id },
        data: { open_time, close_time },
      });
    } else {
      savedHour = await prisma.businessHours.create({
        data: { day_of_week: day, open_time, close_time },
      });
    }
    res.status(201).json(savedHour);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});


// --- ================================== ---
// ---   API GESTIÓN DE RESERVAS ---
// --- ================================== ---

app.post('/api/reservations', async (req, res) => {
  try {
    const { client_id, table_id, party_size, start_time } = req.body;
    if (!client_id || !table_id || !party_size || !start_time) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }
    const reservationTime = new Date(start_time);
    const reservationEndTime = new Date(reservationTime.getTime() + (2 * 60 * 60 * 1000));
    const table = await prisma.table.findUnique({ where: { id: parseInt(table_id) } });
    if (!table) { return res.status(404).json({ error: 'La mesa seleccionada no existe.' }); }
    if (parseInt(party_size) > table.capacity) { return res.status(409).json({ error: `El grupo (${party_size}) excede la capacidad de la mesa (${table.capacity}).` }); }
    const dayOfWeek = reservationTime.getDay();
    const timeOfDay = reservationTime.toTimeString().split(' ')[0].substring(0, 5);
    const businessHour = await prisma.businessHours.findFirst({ where: { day_of_week: dayOfWeek } });
    if (!businessHour) { return res.status(409).json({ error: `El restaurante está cerrado ese día (Día ${dayOfWeek}).` }); }
    if (timeOfDay < businessHour.open_time || timeOfDay > businessHour.close_time) { return res.status(409).json({ error: `La reserva (${timeOfDay}) está fuera del horario laboral (${businessHour.open_time} - ${businessHour.close_time}).` }); }
    const overlappingReservations = await prisma.reservation.findMany({
      where: {
        table_id: parseInt(table_id),
        status: 'confirmed',
        AND: [ { start_time: { lt: reservationEndTime } }, { end_time: { gt: reservationTime } } ],
      },
    });
    if (overlappingReservations.length > 0) { return res.status(409).json({ error: 'La mesa ya está reservada para ese horario.' }); }
    const pointsToAdd = 10;
    const newReservation = await prisma.reservation.create({
      data: {
        client_id: parseInt(client_id),
        table_id: parseInt(table_id),
        party_size: parseInt(party_size),
        start_time: reservationTime,
        end_time: reservationEndTime,
        status: 'confirmed',
        points_earned: pointsToAdd,
        archived_at: null, // Asegurarse de que sea null al crear
      },
      include: { client: true, table: true }
    });
    res.status(201).json(newReservation);
    try {
      await prisma.client.update({
        where: { id: newReservation.client_id },
        data: { loyalty_points: { increment: pointsToAdd } }
      });
      console.log(`✅ ${pointsToAdd} puntos añadidos al cliente ID: ${newReservation.client_id}`);
    } catch (pointsError) { console.error("Error al añadir puntos de lealtad:", pointsError); }
    if (emailTransporter && newReservation.client.email) {
      try {
        const mailOptions = {
          from: '"Restaurante" <reservas@restaurante.com>',
          to: newReservation.client.email,
          subject: '¡Confirmación de tu Reserva! 🍽️',
          html: `<h2>¡Hola ${newReservation.client.name}!</h2><p>Tu reserva está <strong>confirmada</strong>.</p><p>¡Has ganado <strong>${pointsToAdd} puntos</strong> de lealtad!</p><hr><h3>Detalles:</h3><ul><li><strong>Mesa:</strong> #${newReservation.table.table_number}</li><li><strong>Personas:</strong> ${newReservation.party_size}</li><li><strong>Fecha:</strong> ${reservationTime.toLocaleString('es-ES')}</li></ul><p>¡Te esperamos!</p>`
        };
        const info = await emailTransporter.sendMail(mailOptions);
        console.log(`✅ Email de confirmación enviado a: ${newReservation.client.email}`);
        console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
      } catch (emailError) { console.error(`❌ Error al enviar email a ${newReservation.client.email}:`, emailError); }
    }
  } catch (error) {
    console.error("Error al crear la reserva:", error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

/**
 * @route   GET /api/reservations
 */
app.get('/api/reservations', authMiddleware, async (req, res) => { // PROTEGIDO
  try {
    const reservations = await prisma.reservation.findMany({
      where: {
        // --- MODIFICACIÓN CLAVE ---
        // Ya no mostramos 'archived', y ahora tampoco 'completed'.
        // Solo mostramos las que están activas o pendientes de archivar.
        status: {
          in: ['confirmed', 'cancelled'] 
        }
      },
      include: {
        client: true,
        table: true,
      },
      orderBy: {
        start_time: 'asc', // Orden cronológico (más próximo primero)
      },
    });
    res.status(200).json(reservations);
  } catch (error) {
    console.error("Error al obtener reservas:", error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.put('/api/reservations/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const updatedReservation = await prisma.reservation.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'cancelled' },
    });
    res.status(200).json(updatedReservation);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// --- ESTA ES LA RUTA QUE FALLÓ (AHORA CORREGIDA) ---
app.delete('/api/reservations/cancelled', authMiddleware, async (req, res) => { // PROTEGIDO
  console.log('Petición DELETE /api/reservations/cancelled (Archive & Cleanup)');
  
  // --- ANTES (4 Horas) ---
  // const FOUR_HOURS_AGO = new Date(Date.now() - 4 * 60 * 60 * 1000); 
  
  // --- AHORA (15 Minutos) ---
  const FIFTEEN_MINUTES_AGO = new Date(Date.now() - 15 * 60 * 1000); 

  try {
    // 1. Eliminar archivadas de +15 minutos
    const deletionResult = await prisma.reservation.deleteMany({
      where: {
        status: 'archived',
        archived_at: { lt: FIFTEEN_MINUTES_AGO }, // <-- CAMBIO AQUÍ
      },
    });
    // 2. Archivar las 'cancelled'
    const archiveResult = await prisma.reservation.updateMany({
      where: { status: 'cancelled' },
      data: {
        status: 'archived',
        archived_at: new Date(),
      },
    });
    res.status(200).json({
      message: `Proceso completado. ${archiveResult.count} reservas se archivaron (retención de 15 min) y ${deletionResult.count} antiguas se eliminaron.`,
      archived_count: archiveResult.count,
      deleted_count: deletionResult.count,
    });
  } catch (error) {
    console.error("Error en el proceso de archivo y limpieza:", error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// --- ================================== ---
// --- API DE CONSULTAS ESPECIALES ---
// --- ================================== ---

app.get('/api/clients/:id/reservations', authMiddleware, async (req, res) => {
  try {
    const clientReservations = await prisma.reservation.findMany({
      where: { client_id: parseInt(req.params.id) },
      include: { table: true },
      orderBy: { start_time: 'desc' },
    });
    res.status(200).json(clientReservations);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.get('/api/reports/occupancy-by-day', authMiddleware, async (req, res) => {
  try {
    const confirmedReservations = await prisma.reservation.findMany({
      where: { status: 'confirmed' },
      select: { start_time: true, party_size: true }
    });
    let report = [
      { day: 'Domingo', people: 0 }, { day: 'Lunes', people: 0 }, { day: 'Martes', people: 0 },
      { day: 'Miércoles', people: 0 }, { day: 'Jueves', people: 0 }, { day: 'Viernes', people: 0 }, { day: 'Sábado', people: 0 }
    ];
    for (const res of confirmedReservations) {
      const dayIndex = getDay(new Date(res.start_time)); 
      if (report[dayIndex]) {
        report[dayIndex].people += res.party_size;
      }
    }
    res.status(200).json(report);
  } catch (error) {
    console.error("Error al generar el reporte de ocupación:", error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const totalClients = await prisma.client.count();
    const totalTables = await prisma.table.count();
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const todayReservations = await prisma.reservation.count({
      where: {
        status: 'confirmed',
        start_time: { gte: todayStart, lte: todayEnd }
      }
    });
    const upcomingReservations = await prisma.reservation.count({
        where: {
            status: 'confirmed',
            start_time: { gte: new Date() }
        }
    });
    res.status(200).json({
      totalClients,
      totalTables,
      todayReservations,
      upcomingReservations
    });
  } catch (error) {
    console.error("Error al generar estadísticas:", error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// --- RUTA NUEVA/CORREGIDA ---
app.get('/api/reservations/archived', authMiddleware, async (req, res) => {
  console.log('Petición GET /api/reservations/archived');
  try {
    const archivedReservations = await prisma.reservation.findMany({
      where: {
        status: 'archived',
      },
      include: {
        client: true,
        table: true,
      },
      orderBy: {
        archived_at: 'desc',
      }
    });
    res.status(200).json(archivedReservations);
  } catch (error) {
    console.error("Error al obtener reservas archivadas:", error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// --- ================================== ---
// ---   API: AUTENTICACIÓN (Auth)    ---
// --- ================================== ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son obligatorios.' });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newUser = await prisma.user.create({
      data: { username, passwordHash },
    });
    res.status(201).json({ id: newUser.id, username: newUser.username });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ese nombre de usuario ya existe.' });
    }
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son obligatorios.' });
    }
    const user = await prisma.user.findUnique({
      where: { username: username },
    });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }
    const payload = {
      user: { id: user.id, username: user.username },
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login exitoso', token: token });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// --- ================================== ---
// ---   LÓGICA DE WEBSOCKETS Y CRON      ---
// --- ================================== ---

io.on('connection', (socket) => {
  console.log('🔌 Un cliente se ha conectado al WebSocket:', socket.id);
  socket.on('disconnect', () => {
    console.log('🔌 Un cliente se ha desconectado:', socket.id);
  });
});

console.log('⏰ Iniciando tarea programada de recordatorios (se ejecuta cada minuto)...');
cron.schedule('* * * * *', async () => {
  console.log('⏰ [CRON] Buscando recordatorios de reservas...');
  const now = new Date();
  const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);
  const in14Minutes = new Date(now.getTime() + 14 * 60 * 1000); 
  try {
    const upcomingReservations = await prisma.reservation.findMany({
      where: {
        status: 'confirmed',
        start_time: { gte: in14Minutes, lte: in15Minutes }
      },
      include: { client: true, table: true }
    });
    for (const res of upcomingReservations) {
      console.log(`[CRON] ¡RECORDATORIO ENCONTRADO! Reserva ID: ${res.id}. Emitiendo evento...`);
      const message = `Recordatorio: Reserva de ${res.client.name} (Mesa #${res.table.table_number}) en 15 minutos.`;
      io.emit('upcoming_reservation', {
        id: res.id,
        message: message,
      });
    }
  } catch (error) {
    console.error("[CRON] Error al buscar recordatorios:", error);
  }
});

// ... (cerca de tu otro cron.schedule)

// --- ================================== ---
// ---   NUEVO: CRON JOB DE LIMPIEZA      ---
// --- (Actualizado para incluir 'seated') ---
// --- ================================== ---

// Se ejecuta 'cada hora' (a la hora 0 de cada hora, ej: 1:00, 2:00, 3:00)
console.log('⏰ Iniciando tarea programada de limpieza (se ejecuta cada hora)...');
cron.schedule('0 * * * *', async () => {
  console.log('🧹 [CRON-Limpieza] Ejecutando limpieza de reservas completadas...');
  const now = new Date();
  
  try {
    // 1. Buscar todas las reservas 'confirmadas' (no-shows) Y 'seated' (atendidas)
    //    cuya HORA DE FINALIZACIÓN ya haya pasado.
    const result = await prisma.reservation.updateMany({
      where: {
        // --- MODIFICACIÓN CLAVE ---
        status: {
          in: ['confirmed', 'seated'] // <-- Ahora limpia ambos estados
        },
        end_time: {
          lt: now // 'lt' = less than (menor que la hora actual)
        }
      },
      data: {
        status: 'completed' // Marcarlas como 'completadas'
      }
    });
    
    if (result.count > 0) {
      console.log(`🧹 [CRON-Limpieza] ${result.count} reservas (confirmadas/sentadas) marcadas como 'completadas'.`);
    }

  } catch (error) {
    console.error("[CRON-Limpieza] Error al limpiar reservas:", error);
  }
});

// --- ================================== ---
// ---   NUEVA API: CHECK-IN DE RESERVA   ---
// --- ================================== ---

/**
 * @route   PUT /api/reservations/:id/check-in
 * @desc    Cambia el estado de una reserva a "seated" (sentado)
 */
app.put('/api/reservations/:id/check-in', authMiddleware, async (req, res) => {
  const { id } = req.params;
  console.log(`Petición PUT /api/reservations/${id}/check-in`);

  try {
    const updatedReservation = await prisma.reservation.update({
      where: {
        id: parseInt(id),
      },
      data: {
        status: 'seated' // El nuevo estado
      },
    });
    
    res.status(200).json(updatedReservation);

  } catch (error) {
    console.error("Error al hacer check-in de la reserva:", error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// --- ================================== ---
// ---   NUEVA API: CLIENTE DESTACADO     ---
// --- ================================== ---

/**
 * @route   GET /api/reports/top-client
 * @desc    Encuentra al cliente con más puntos de lealtad
 */
app.get('/api/reports/top-client', authMiddleware, async (req, res) => {
  console.log('Petición GET /api/reports/top-client');

  try {
    // 1. Buscar al cliente con más puntos
    //    Usamos 'findFirst' con 'orderBy' descendente.
    const topClient = await prisma.client.findFirst({
      where: {
        loyalty_points: {
          gt: 0 // Solo considerar clientes que tengan al menos 1 punto
        }
      },
      orderBy: {
        loyalty_points: 'desc' // 'desc' = descendente (el más alto primero)
      }
    });

    // 2. Enviar el cliente (o 'null' si nadie tiene puntos)
    res.status(200).json(topClient);

  } catch (error) {
    console.error("Error al generar cliente destacado:", error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// --- ================================== ---
// ---       INICIAR EL SERVIDOR          ---
// --- ================================== ---
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor HTTP y WebSocket corriendo en http://localhost:${PORT}`);
});