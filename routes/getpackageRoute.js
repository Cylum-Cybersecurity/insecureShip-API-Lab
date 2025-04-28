
/**
 * Package search route with insecure regular expression usage.
 * Demonstrates a realistic ReDoS vulnerability in a delivery context.
 */

const express = require('express');
const router = express.Router();
const Package = require('../models/Package');
const { verifyToken } = require('../middlewares/authMiddleware');

// [x] Accepts a regex pattern from user and applies it directly without limits or sanitization
router.post('/search-tracking', verifyToken, async (req, res) => {
  const { pattern } = req.body;

  try {
    const regex = new RegExp(`^(${pattern.replace(/[();]/g, '')})+$`); // [x] Nested regex, vulnerable to backtracking (ReDoS)

    const allPackages = await Package.find();
    console.time("match");
    const matches = allPackages.filter(pkg => regex.test(pkg.trackingNumber));
    console.timeEnd("match");

    res.json({ matches });
  } catch (err) {
    res.status(500).json({ error: 'Invalid pattern or internal error', details: err.message });
  }
});

module.exports = router;
