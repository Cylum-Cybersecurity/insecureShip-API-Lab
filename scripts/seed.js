const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Package = require('../models/Package');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/insecuredb';

async function seed() {
  await mongoose.connect(MONGO_URI);

  await User.deleteMany({});
  await Package.deleteMany({});

  await User.insertMany([
    { username: 'lucas', password: '1234', role: 'CUSTOMER' },
    { username: 'maria', password: '1234', role: 'CUSTOMER' },
    { username: 'daniela', password: '1234', role: 'DRIVER' },
    { username: 'carlos', password: '1234', role: 'DISPATCHER' },
    { username: 'admin', password: 'admin123', role: 'ADMIN' }
  ]);

  await Package.insertMany([
    {
      trackingNumber: 'PKG001',
      sender: 'lucas',
      recipient: 'maria',
      address: '123 Main Street',
      status: 'PENDING',
      assignedTo: 'daniela'
    },
    {
      trackingNumber: 'PKG002',
      sender: 'maria',
      recipient: 'lucas',
      address: '456 Side Avenue',
      status: 'IN_TRANSIT',
      assignedTo: 'daniela'
    }
  ]);

  console.log('✅ Base de datos poblada con datos de ejemplo');
  process.exit();
}

seed().catch((err) => {
  console.error('❌ Error al poblar la base de datos:', err);
  process.exit(1);
});
