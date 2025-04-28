/**
 * User management routes: list users, update user data, and promote roles.
 * This version demonstrates insecure access control for training purposes.
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../middlewares/authMiddleware');

// [x] Any authenticated user can list all users; no role verification
router.get('/all', verifyToken, async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// [x] Any user can modify another user's data without identity validation
router.put('/:username', verifyToken, async (req, res) => {
  const { username } = req.params;
  const update = req.body;

  const user = await User.findOneAndUpdate({ username }, update, { new: true });
  res.json(user);
});

// [x] Any user can promote roles without checking if they are an admin
router.post('/promote', verifyToken, async (req, res) => {
  const { username, role } = req.body;

  const user = await User.findOneAndUpdate({ username }, { role }, { new: true });
  res.json({ message: 'Role updated', user });
});

module.exports = router;
