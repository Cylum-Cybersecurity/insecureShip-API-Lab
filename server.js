const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const mongoose = require('mongoose');
dotenv.config();

// old routes
const utilsRoutes = require('./routes/oldRoutes/utilsRoutes');

// new routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const packageRoutes = require('./routes/packageRoutes');
const imageRoutes = require('./routes/imageRoutes');
const getpackageRoute = require('./routes/getpackageRoute');

const app = express();

// ❌ Security Misconfiguration (nivel 0)
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// old API 
app.use('/api/v0/utils', utilsRoutes);

// New API Version
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/package', getpackageRoute);


// ❌ Errores verbosos
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('📦 Connected to MongoDB (Docker)');
  app.listen(process.env.PORT, () => {
    console.log(`🚀 Insecure API running at http://localhost:${process.env.PORT}`);
  });
}).catch(err => console.error('❌ MongoDB connection error', err));
