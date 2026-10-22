// Rutas API para la gestión de proyectos (Node.js / Express).
// La lógica de interfaz vive en el archivo raíz Proyectos.js, no aquí.
const express = require('express');
const router = express.Router();
const { conectarSQL, sql } = require('../db');

// Listar proyectos
router.get('/', async (req, res) => {
  let pool;
  try {
    pool = await conectarSQL();
    const result = await pool.request().query(`
      SELECT proyecto_id, codigo, nombre, descripcion, fecha_inicio, fecha_fin, presupuesto, estado
      FROM proyectos
      ORDER BY proyecto_id DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error listando proyectos:', err.message);
    res.status(500).json({ error: 'No se pudieron cargar los proyectos. Verifique la conexión y la tabla proyectos.' });
  }
});

// Crear proyecto
router.post('/', async (req, res) => {
  const { codigo, nombre, descripcion, fecha_inicio, fecha_fin, presupuesto, estado } = req.body || {};
  if (!nombre || !String(nombre).trim() || !estado) {
    return res.status(400).json({ error: 'El nombre y el estado del proyecto son obligatorios.' });
  }

  let pool;
  try {
    pool = await conectarSQL();
    const request = pool.request();
    request.input('codigo', sql.NVarChar(50), codigo ? String(codigo).trim() : null);
    request.input('nombre', sql.NVarChar(200), String(nombre).trim());
    request.input('descripcion', sql.NVarChar(sql.MAX), descripcion || null);
    request.input('fecha_inicio', sql.Date, fecha_inicio || null);
    request.input('fecha_fin', sql.Date, fecha_fin || null);
    request.input('presupuesto', sql.Decimal(18, 2), Number(presupuesto) || 0);
    request.input('estado', sql.NVarChar(50), String(estado));
    const result = await request.query(`
      INSERT INTO proyectos (codigo, nombre, descripcion, fecha_inicio, fecha_fin, presupuesto, estado)
      VALUES (@codigo, @nombre, @descripcion, @fecha_inicio, @fecha_fin, @presupuesto, @estado);
      SELECT CAST(SCOPE_IDENTITY() AS INT) AS proyecto_id;
    `);
    res.status(201).json({ ok: true, mensaje: 'Proyecto creado correctamente.', proyecto_id: result.recordset[0].proyecto_id });
  } catch (err) {
    console.error('Error creando proyecto:', err.message);
    res.status(500).json({ error: 'No se pudo crear el proyecto. Verifique que la tabla proyectos tenga las columnas esperadas.' });
  }
});

// Actualizar proyecto
router.put('/:id', async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const { codigo, nombre, descripcion, fecha_inicio, fecha_fin, presupuesto, estado } = req.body || {};
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Identificador de proyecto no válido.' });
  if (!nombre || !String(nombre).trim()) return res.status(400).json({ error: 'El nombre del proyecto es obligatorio.' });

  let pool;
  try {
    pool = await conectarSQL();
    const request = pool.request();
    request.input('id', sql.Int, id);
    request.input('codigo', sql.NVarChar(50), codigo ? String(codigo).trim() : null);
    request.input('nombre', sql.NVarChar(200), String(nombre).trim());
    request.input('descripcion', sql.NVarChar(sql.MAX), descripcion || null);
    request.input('fecha_inicio', sql.Date, fecha_inicio || null);
    request.input('fecha_fin', sql.Date, fecha_fin || null);
    request.input('presupuesto', sql.Decimal(18, 2), Number(presupuesto) || 0);
    request.input('estado', sql.NVarChar(50), estado || 'Planificado');
    const result = await request.query(`
      UPDATE proyectos
      SET codigo=@codigo, nombre=@nombre, descripcion=@descripcion,
          fecha_inicio=@fecha_inicio, fecha_fin=@fecha_fin, presupuesto=@presupuesto, estado=@estado
      WHERE proyecto_id=@id;
      SELECT @@ROWCOUNT AS filas;
    `);
    if (!result.recordset[0] || result.recordset[0].filas === 0) return res.status(404).json({ error: 'Proyecto no encontrado.' });
    res.json({ ok: true, mensaje: 'Proyecto actualizado correctamente.' });
  } catch (err) {
    console.error('Error actualizando proyecto:', err.message);
    res.status(500).json({ error: 'No se pudo actualizar el proyecto.' });
  }
});

// Eliminar proyecto
router.delete('/:id', async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Identificador de proyecto no válido.' });
  let pool;
  try {
    pool = await conectarSQL();
    const request = pool.request().input('id', sql.Int, id);
    const result = await request.query('DELETE FROM proyectos WHERE proyecto_id=@id; SELECT @@ROWCOUNT AS filas;');
    if (!result.recordset[0] || result.recordset[0].filas === 0) return res.status(404).json({ error: 'Proyecto no encontrado.' });
    res.json({ ok: true, mensaje: 'Proyecto eliminado correctamente.' });
  } catch (err) {
    console.error('Error eliminando proyecto:', err.message);
    res.status(500).json({ error: 'No se pudo eliminar el proyecto.' });
  }
});

// El módulo no incluye tablas de tareas/progreso. Devuelve valores iniciales para que
// la pantalla pueda mostrarse sin inventar datos de avance.
router.get('/:id/progreso', (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Identificador de proyecto no válido.' });
  res.json({ proyecto_id: id, progresoGeneral: 0, tareasCompletadas: 0, totalTareas: 0 });
});

module.exports = router;
