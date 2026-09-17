const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifica el token (cookie httpOnly 'rc_token' o cabecera Bearer) y adjunta el usuario
exports.proteger = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token =
    (req.cookies && req.cookies.rc_token) ||
    (header.startsWith('Bearer ') ? header.slice(7) : null);

  if (!token) {
    return res.status(401).json({ mensaje: 'No autorizado. Inicia sesión.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(payload.id).select('-password');
    if (!req.user) return res.status(401).json({ mensaje: 'Usuario no encontrado.' });
    next();
  } catch (err) {
    return res.status(401).json({ mensaje: 'Token inválido o expirado.' });
  }
};

// Solo administradores
exports.soloAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso solo para administradores.' });
  }
  next();
};