const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const { authMiddleware , adminMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// Register Admin (Run once)
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) return res.status(400).json({ error: "Admin already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ username, password: hashedPassword });
    await newAdmin.save();

    res.status(201).json({ message: "Admin registered successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error registering admin" });
  }
});

// Login Admin
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      console.error("Admin not found:", username);
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      console.error("Password does not match for:", username);
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // JWT Token Generation (Fixed)
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// router.get("/check", authMiddleware, adminMiddleware, (req, res) => {
//   res.status(200).json({ isAdmin: true });
// });


module.exports = router;
