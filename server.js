const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = Number(process.env.PORT) || 3001;
const { conectarSQL, config: dbConfig } = require('./db');

// Middleware
app.use(cors());
app.use(express.json());

// Diagnóstico de conexión: abrir http://localhost:3001/api/health para comprobar SQL Server.
app.get('/api/health', async (req, res) => {
  try {
    const pool = await conectarSQL();
    const result = await pool.request().query('SELECT DB_NAME() AS base, @@SERVERNAME AS servidor');
    res.json({ ok: true, servidor: result.recordset[0].servidor, base: result.recordset[0].base });
  } catch (err) {
    console.error('Diagnóstico SQL Server fallido:', err.message);
    res.status(503).json({
      ok: false,
      error: 'No se pudo conectar a SQL Server con autenticación integrada de Windows.',
      servidorConfigurado: dbConfig.server,
      baseConfigurada: dbConfig.database,
      detalle: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// RUTAS API BÁSICAS (para que el frontend no falle)
app.get('/api/reportes', (req, res) => {
  res.json([
    { id: 1, nombre: 'Reporte 1', tipo: 'Proyecto' },
    { id: 2, nombre: 'Reporte 2', tipo: 'Recurso' }
  ]);
});

app.post('/api/reportes', (req, res) => {
  console.log('Reporte recibido:', req.body);
  res.json({ mensaje: 'Reporte creado exitosamente', id: 3 });
});

// Importar y usar las rutas que SÍ tienes
const rolesRoutes = require('./routes/roles');
const usersRoutes = require('./routes/users');
const clientesRoutes = require('./routes/clientes');
const proyectosRoutes = require('./routes/proyectos');
const ajustesRoutes = require('./routes/ajustes');

app.use('/api/roles', rolesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/proyectos', proyectosRoutes);
app.use('/api/ajustes', ajustesRoutes);

// Sirve archivos estáticos
app.use(express.static(__dirname));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en http://localhost:${PORT}`);
  console.log(`✅ API disponible en http://localhost:${PORT}/api/reportes`);
  console.log(`🔎 Diagnóstico de SQL Server: http://localhost:${PORT}/api/health`);
  conectarSQL().then(() => console.log('✅ Conexión con SQL Server lista')).catch(() => console.error('⚠️ El servidor web inició, pero la conexión SQL requiere revisión. Consulte /api/health.'));
});