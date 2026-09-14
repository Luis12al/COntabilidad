require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Uso: node cambiar-password.js correo@ejemplo.com nuevaClave123
(async () => {
  const [email, nuevaPassword] = process.argv.slice(2);
  if (!email || !nuevaPassword) {
    console.log('Uso: node cambiar-password.js <email> <nueva-password>');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const hash = await bcrypt.hash(nuevaPassword, 10);
  const u = await User.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { password: hash }
  );
  console.log(u ? `✅ Contraseña actualizada para ${email}` : '❌ Usuario no encontrado.');
  await mongoose.disconnect();
})();