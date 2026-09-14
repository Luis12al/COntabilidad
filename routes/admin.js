const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Purchase = require('../models/Purchase');
const { proteger, soloAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(proteger, soloAdmin); // todo aquí es solo para admin

// GET /api/admin/users -> lista de clientes
router.get('/users', async (req, res) => {
  try {
    const usuarios = await User.find({ rol: 'cliente' }).select('nombre email createdAt');
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al listar usuarios.', error: err.message });
  }
});

// POST /api/admin/users -> añadir usuario (cliente o admin)
router.post('/users', async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ mensaje: 'Nombre, email y contraseña son obligatorios.' });
    }

    const existe = await User.findOne({ email: email.toLowerCase().trim() });
    if (existe) return res.status(409).json({ mensaje: 'Ese email ya está registrado.' });

    const hash = await bcrypt.hash(password, 10);
    const usuario = await User.create({
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      password: hash,
      rol: rol === 'admin' ? 'admin' : 'cliente'
    });

    res.status(201).json({ id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al crear usuario.', error: err.message });
  }
});

// GET /api/admin/export/:userId -> descargar CSV de compras de un cliente
router.get('/export/:userId', async (req, res) => {
  try {
    const usuario = await User.findById(req.params.userId).select('nombre email');
    if (!usuario) return res.status(404).json({ mensaje: 'Cliente no encontrado.' });

    const compras = await Purchase.find({ usuario: usuario._id }).sort({ fecha: -1 });

    const escapar = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const filas = compras.map(c =>
      [c.fecha.toLocaleString('es-CO'), escapar(c.item), c.cantidad, c.valor, c.cantidad * c.valor].join(',')
    );

    const csv = ['Fecha,Producto,Cantidad,Valor unitario,Total', ...filas].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="compras_${usuario.email}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al exportar.', error: err.message });
  }
});

module.exports = router;
