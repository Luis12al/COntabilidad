require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🔗 Conectado a:', mongoose.connection.name);
  console.log('📋 Host:', mongoose.connection.host);
  const usuarios = await User.find().select('email rol');
  console.log('👥 Usuarios en esta base de datos:');
  usuarios.forEach(u => console.log(`  - ${u.email} (${u.rol})`));
  if (!usuarios.length) console.log('  (vacía)');
  await mongoose.disconnect();
})();