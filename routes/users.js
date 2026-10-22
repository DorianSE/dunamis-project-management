// routes/users.js
const express = require('express');
const router = express.Router();
const { conectarSQL } = require('../db');
const bcrypt = require('bcrypt');

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const pool = await conectarSQL();
    const result = await pool.request()
      .query(`
        SELECT u.usuario_id, u.username, u.email, u.role_id, u.activo, u.created_at, 
               r.nombre as rol_nombre
        FROM usuarios u
        LEFT JOIN roles r ON u.role_id = r.role_id
        ORDER BY u.usuario_id
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err });
  }
});

// POST /api/users  --> crear usuario
router.post('/', async (req, res) => {
  const { username, password, email, role_id } = req.body;
  
  // Validaciones
  if (!username || !password || !role_id) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  // Validar formato de email si se proporciona
  if (email && (!email.includes('@') || !email.includes('.'))) {
    return res.status(400).json({ error: 'Email no válido' });
  }

  try {
    const pool = await conectarSQL();
    // Verificar si el usuario ya existe
    const userCheck = await pool.request()
      .input('username', username)
      .query('SELECT usuario_id FROM usuarios WHERE username = @username');

    if (userCheck.recordset.length > 0) {
      return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }

    // Hash de contraseña con bcrypt (más seguro que SHA-256)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insertar usuario
    const request = pool.request();
    request.input('username', username);
    request.input('password_hash', passwordHash);
    request.input('email', email || null);
    request.input('role_id', parseInt(role_id));
    
    const sqlQuery = `
      INSERT INTO usuarios (username, password_hash, email, role_id, activo, created_at)
      VALUES (@username, @password_hash, @email, @role_id, 1, GETDATE());
      SELECT SCOPE_IDENTITY() AS usuario_id;
    `;

    const result = await request.query(sqlQuery);
    const newId = result.recordset[0].usuario_id;
    
    res.json({ 
      ok: true, 
      usuario_id: newId,
      mensaje: 'Usuario creado exitosamente' 
    });
  } catch (err) {
    console.error('Error creando usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/users/login -> autenticación
router.post('/login', async (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  try {
    const pool = await conectarSQL();
    const result = await pool.request()
      .input('username', username)
      .query(`
        SELECT u.usuario_id, u.username, u.password_hash, u.email, u.role_id, u.activo,
               r.nombre AS rol_nombre
        FROM usuarios AS u
        LEFT JOIN roles AS r ON u.role_id = r.role_id
        WHERE u.username = @username AND u.activo = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }

    const user = result.recordset[0];
    if (!user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    delete user.password_hash;
    return res.json({ ok: true, mensaje: 'Login exitoso', user });
  } catch (err) {
    console.error('Error en /api/users/login:', err.message);
    return res.status(503).json({
      error: 'No se pudo consultar la base de datos. Compruebe SQL Server, la autenticación de Windows y la base pyme_sys.',
      detalle: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;