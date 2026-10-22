// routes/clientes.js
const express = require('express');
const router = express.Router();
const { conectarSQL } = require('../db');

// GET /api/clientes
router.get('/', async (req, res) => {
  try {
    const pool = await conectarSQL();
    const result = await pool.request().query('SELECT cliente_id, nombre, tipo_persona, identificacion, correo FROM clientes ORDER BY cliente_id');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err });
  }
});

// POST /api/clientes
router.post('/', async (req, res) => {
  const { nombre, tipo_persona, identificacion, correo } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    const pool = await conectarSQL();
    const request = pool.request();
    request.input('nombre', nombre);
    request.input('tipo_persona', tipo_persona || 'Natural');
    request.input('identificacion', identificacion || null);
    request.input('correo', correo || null);
    const q = `INSERT INTO clientes (nombre, tipo_persona, identificacion, correo, created_at)
               VALUES (@nombre, @tipo_persona, @identificacion, @correo, GETDATE());
               SELECT SCOPE_IDENTITY() AS cliente_id;`;
    const r = await request.query(q);
    res.json({ ok: true, cliente_id: r.recordset[0].cliente_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err });
  }
});

module.exports = router;
