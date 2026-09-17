require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');

// --- Validación de configuración en producción ---
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET debe tener al menos 32 caracteres en producción.');
    process.exit(1);
  }
}

const app = express();
app.set('trust proxy', 1); // Render está detrás de un proxy (necesario para rate limiting)

// --- Cabeceras de seguridad HTTP + Content Security Policy ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],                       // solo archivos propios (app.js)
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// --- Limpieza contra inyección NoSQL ($gt, $where, etc.) ---
app.use(mongoSanitize());

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// --- CORS: mismo origen por defecto (frontend servido por este mismo servidor) ---
// Si algún día separas frontend y backend, define CORS_ORIGIN=https://tudominio.com
if (process.env.CORS_ORIGIN) {
  const cors = require('cors');
  app.use(cors({ origin: process.env.CORS_ORIGIN.split(','), credentials: true }));
}

// --- Rate limiting general ---
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' }
}));

// --- Rate limiting estricto en login (anti fuerza bruta) ---
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,                      // solo intentos FALLIDOS cuentan
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: 'Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo.' }
}));

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => {
    console.error('❌ Error de conexión a MongoDB:', err.message);
    process.exit(1);
  });

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/admin', require('./routes/admin'));

// Frontend estático
app.use(express.static(path.join(__dirname, 'public')));

// Cualquier otra ruta -> index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));