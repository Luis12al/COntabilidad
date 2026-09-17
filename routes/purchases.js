const express = require('express');
const Purchase = require('../models/Purchase');
const { proteger } = require('../middleware/auth');

const router = express.Router();
router.use(proteger); // todas las rutas requieren login

// POST /api/purchases  -> el CLIENTE registra una compra
router.post('/', async (req, res) => {
  try {
    const { item, cantidad, valor } = req.body;
    if (!item || !cantidad || valor === undefined) {
      return res.status(400).json({ mensaje: 'Completa todos los campos.' });
    }
    if (cantidad < 1 || valor < 0) {
      return res.status(400).json({ mensaje: 'Cantidad y valor no válidos.' });
    }

    const compra = await Purchase.create({
      usuario: req.user._id,
      item: item.trim(),
      cantidad: Number(cantidad),
      valor: Number(valor)
      // fecha se asigna automáticamente
    });

    res.status(201).json(compra);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al guardar la compra.', error: err.message });
  }
});

// GET /api/purchases/mine?desde=ISO&hasta=ISO
// Sin parámetros devuelve todo; con desde/hasta filtra por rango de fechas.
router.get('/mine', async (req, res) => {
  try {
    const filtro = { usuario: req.user._id };
    const { desde, hasta } = req.query;

    if (desde || hasta) {
      filtro.fecha = {};
      if (desde) filtro.fecha.$gte = new Date(desde);
      if (hasta) filtro.fecha.$lte = new Date(hasta);
    }

    const compras = await Purchase.find(filtro).sort({ fecha: -1 });
    res.json(compras);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener compras.', error: err.message });
  }
});

module.exports = router;
