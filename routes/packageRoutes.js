/**
 * Package routes for viewing, creating, and updating delivery packages.
 * This version includes intentionally insecure behavior for training purposes.
 */

const express = require('express');
const router = express.Router();
const Package = require('../models/Package');
const { verifyToken } = require('../middlewares/authMiddleware');

// [x] Any authenticated user can list all packages without role restriction
router.get('/all', verifyToken, async (req, res) => {
  const packages = await Package.find();
  res.json(packages);
});

// [x] Any user can create a package; does not enforce CUSTOMER role
router.post('/create', verifyToken, async (req, res) => {
  const newPackage = new Package(req.body);
  await newPackage.save();
  res.json({ message: 'Package created', newPackage });
});

// [x] Drivers can update any package, even if not assigned to them
router.put('/:trackingNumber/update', verifyToken, async (req, res) => {
  const { trackingNumber } = req.params;
  const update = req.body;

  const updated = await Package.findOneAndUpdate(
    { trackingNumber },
    update,
    { new: true }
  );
  res.json(updated);
});

module.exports = router;
