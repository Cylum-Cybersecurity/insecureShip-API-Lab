const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  trackingNumber: { type: String, required: true, unique: true },
  sender: String,
  recipient: String,
  address: String,
  status: {
    type: String,
    enum: ['PENDING', 'IN_TRANSIT', 'DELIVERED'],
    default: 'PENDING'
  },
  assignedTo: String // username del DRIVER (puede ser null)
});

module.exports = mongoose.model('Package', packageSchema);
