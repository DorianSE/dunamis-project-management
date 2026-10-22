const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Asegúrate de que esta carpeta exista
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Ruta para subir archivos
router.post('/', upload.single('archivo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }
  res.status(200).json({
    mensaje: 'Archivo subido correctamente',
    nombre: req.file.filename,
    ruta: req.file.path
  });
});

module.exports = router;
