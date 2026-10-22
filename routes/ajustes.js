// routes/ajustes.js
const express = require('express');
const router = express.Router();
const { conectarSQL, sql } = require('../db');

// POST /api/ajustes  -> crea ajuste con sus partidas (en una transacción)
router.post('/', async (req, res) => {
  const { codigo, fecha_solicitud, solicitado_por, origen, tipo, programa_id, unidad_origen_id, unidad_destino_id, motivo, partidas } = req.body;
  // partidas: array [{folio, descripcion, monto}]
  let pool;
  let transaction;
  try {
    pool = await conectarSQL();
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    const tRequest = transaction.request();

    tRequest.input('codigo', codigo || null);
    tRequest.input('fecha_solicitud', fecha_solicitud ? new Date(fecha_solicitud) : new Date());
    tRequest.input('solicitado_por', solicitado_por ? parseInt(solicitado_por) : null);
    tRequest.input('origen', origen || null);
    tRequest.input('tipo', tipo || 'Interno');
    tRequest.input('programa_id', programa_id ? parseInt(programa_id) : null);
    tRequest.input('unidad_origen_id', unidad_origen_id ? parseInt(unidad_origen_id) : null);
    tRequest.input('unidad_destino_id', unidad_destino_id ? parseInt(unidad_destino_id) : null);
    tRequest.input('motivo', motivo || null);
    tRequest.input('estado', 'Pendiente');

    const insertAjusteQ = `INSERT INTO ajustes_presupuesto (codigo, fecha_solicitud, solicitado_por, origen, tipo, programa_id, unidad_origen_id, unidad_destino_id, motivo, estado, created_at)
                           VALUES (@codigo, @fecha_solicitud, @solicitado_por, @origen, @tipo, @programa_id, @unidad_origen_id, @unidad_destino_id, @motivo, @estado, GETDATE());
                           SELECT SCOPE_IDENTITY() AS ajuste_id;`;

    const resultAjuste = await tRequest.query(insertAjusteQ);
    const ajuste_id = resultAjuste.recordset[0].ajuste_id;

    if (Array.isArray(partidas) && partidas.length > 0) {
      for (let p of partidas) {
        await transaction.request()
          .input('ajuste_id', parseInt(ajuste_id))
          .input('folio', p.folio || null)
          .input('descripcion', p.descripcion || null)
          .input('monto', p.monto ? parseFloat(p.monto) : 0)
          .query(`INSERT INTO partidas_ajuste (ajuste_id, folio, descripcion, monto, created_at)
                  VALUES (@ajuste_id, @folio, @descripcion, @monto, GETDATE())`);
      }
    }

    await transaction.commit();
    res.json({ ok: true, ajuste_id });
  } catch (err) {
    console.error(err);
    try { await transaction.rollback(); } catch(e) {}
    res.status(500).json({ error: err.message || err });
  }
});

module.exports = router;
