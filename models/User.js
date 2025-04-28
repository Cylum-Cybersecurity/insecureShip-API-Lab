const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: String, // ❌ Vulnerabilidad: sin hash
  role: {
    type: String,
    enum: ['CUSTOMER', 'DRIVER', 'DISPATCHER', 'ADMIN'],
    default: 'CUSTOMER'
  }
});

module.exports = mongoose.model('User', userSchema);
