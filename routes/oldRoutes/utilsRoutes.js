/**
 * Utility route for executing system commands.
 * This version demonstrates remote command execution for educational purposes.
 */

const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const { verifyToken } = require('../../middlewares/authMiddleware');

// [x] Executes any system command from user input without validation or restrictions
router.post('/exec', verifyToken, (req, res) => {
  const { command } = req.body;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      return res.status(400).json({ stderr });
    }
    res.json({ output: stdout });
  });
});

module.exports = router;
