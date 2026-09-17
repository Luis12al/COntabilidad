const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Cookie segura: httpOnly (no accesible desde JS), SameSite y Secure en producción
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 12 * 60 * 60 * 1000, // 12 horas
  path: '/'
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ mensaje: 'Email y contraseña son obligatorios.' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    // Mensaje genérico: no revelar si el email existe o no
    if (!user || !(await bcrypt.compare(String(password), user.password))) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
    }

    const token = jwt.sign({ id: user._id, rol: user.rol }, process.env.JWT_SECRET, {
      expiresIn: '12h'
    });

    // El token viaja en cookie httpOnly, NO en el cuerpo de la respuesta
    res.cookie('rc_token', token, COOKIE_OPTS);
    res.json({
      usuario: { id: user._id, nombre: user.nombre, email: user.email, rol: user.rol }
    });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
});

// POST /api/auth/logout — limpia la cookie de sesión
router.post('/logout', (req, res) => {
  res.clearCookie('rc_token', { ...COOKIE_OPTS, maxAge: undefined });
  res.json({ mensaje: 'Sesión cerrada.' });
});

module.exports = router;