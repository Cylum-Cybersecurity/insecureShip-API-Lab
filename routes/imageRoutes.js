/**
 * Fetches an image from a given URL, encodes it in base64, 
 * and returns it along with its content type.
 * Requires authentication.
 */

const express = require("express");
const router = express.Router();
const axios = require("axios");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/fetch", verifyToken, async (req, res) => {
  const { imageUrl } = req.body;

  try {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const base64 = Buffer.from(response.data, "binary").toString("base64");
    const contentType = response.headers["content-type"];

    res.json({ contentType, base64 });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error downloading image", details: err.message });
  }
});

module.exports = router;
