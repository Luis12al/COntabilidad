require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Purchase = require('./models/Purchase');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado a MongoDB');

  // Limpiar datos anteriores (¡cuidado en producción!)
  await User.deleteMany({});
  await Purchase.deleteMany({});

  const hashAdmin = await bcrypt.hash('admin123', 10);
  const hashCliente = await bcrypt.hash('cliente123', 10);

  const admin = await User.create({
    nombre: 'Administrador',
    email: 'admin@demo.com',
    password: hashAdmin,
    rol: 'admin'
  });

  const cliente = await User.create({
    nombre: 'Cliente Demo',
    email: 'cliente@demo.com',
    password: hashCliente,
    rol: 'cliente'
  });

  await Purchase.insertMany([
    { usuario: cliente._id, item: 'Cuaderno profesional', cantidad: 3, valor: 8500 },
    { usuario: cliente._id, item: 'Lápiz negro x12', cantidad: 2, valor: 12000 },
    { usuario: cliente._id, item: 'Mochila escolar', cantidad: 1, valor: 95000 }
  ]);

  console.log('✅ Datos de prueba creados:');
  console.log('   Admin   -> admin@demo.com / admin123');
  console.log('   Cliente -> cliente@demo.com / cliente123');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
