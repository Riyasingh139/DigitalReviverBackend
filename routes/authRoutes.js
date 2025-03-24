const express = require("express");
const router = express.Router();

// Dummy login route (Replace with your actual logic)
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  res.json({ message: "Login successful", token: "dummy-jwt-token" });
});

module.exports = router;
