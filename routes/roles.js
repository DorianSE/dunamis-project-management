// routes/roles.js
const express = require('express');
const router = express.Router();
const { conectarSQL, sql } = require('../db');

router.get('/', async (req, res) => {
  try {
    const pool = await conectarSQL();
    const result = await pool.request().query('SELECT role_id, nombre, descripcion FROM roles ORDER BY role_id');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err });
  }
});

module.exports = router;
