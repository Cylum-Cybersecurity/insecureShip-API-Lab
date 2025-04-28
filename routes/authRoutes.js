/**
 * Authentication routes: registration and login using JWT.
 * This version is intentionally insecure for educational purposes.
 */

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const SECRET = process.env.JWT_SECRET || 'insecuresecret'; // [x] Hardcoded secret

// [x] Insecure registration: no input validation, no password hashing, role can be set arbitrarily
router.post("/register", async (req, res) => {
  const { username, password, role } = req.body;
  const user = new User({ username, password, role });
  await user.save();

  res.status(201).json({ message: "User created", user });
});

// [x] Insecure login: direct password comparison, no hashing
// [x] Issues JWT with long expiration and weak secret
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username, password });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    SECRET,
    { expiresIn: "7d" } // [x] Token expiration too long
  );

  res.json({ message: "Login successful", token });
});

module.exports = router;
