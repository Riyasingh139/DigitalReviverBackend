const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");

const Blog = require('../models/Blog');
// const service = require("../models/Service")
require("dotenv").config();

// Forgot Password Route
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) return res.status(400).json({ message: "Admin not found" });

    // Generate & Hash Reset Token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    admin.resetPasswordToken = hashedToken;
    admin.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await admin.save();

    // Email Setup
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASS },
    });

    const resetLink = `http://localhost:8080/reset-password/${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL,
      to: admin.email,
      subject: "Password Reset Request",
      text: `Click the link to reset your password: ${resetLink}`,
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) return res.status(500).json({ message: "Error sending email" });
      res.json({ message: "Reset link sent to email" });
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Reset Password Route
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const admin = await Admin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!admin) return res.status(400).json({ message: "Invalid or expired token." });

    // Hash new password
    admin.password = await bcrypt.hash(newPassword, 10);
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;

    await admin.save();
    res.json({ message: "Password reset successfully!" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Login Route


router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });

  if (!admin) {
    return res.status(400).json({ error: "User not found" });
  }

  const storedPassword = admin.password;
  const isHashed = storedPassword.startsWith("$2b$");

  let isMatch;
  if (isHashed) {
    isMatch = await bcrypt.compare(password, storedPassword);
  } else {
    isMatch = password === storedPassword;
  }

  if (!isMatch) {
    return res.status(400).json({ error: "Incorrect password" });
  }

  // OPTIONAL: Convert plain-text passwords to hashed ones
  if (!isHashed) {
    const hashedNewPassword = await bcrypt.hash(password, 10);
    await Admin.updateOne({ username }, { $set: { password: hashedNewPassword } });
  }

  //  Generate JWT Token
  const token = jwt.sign(
    { id: admin._id, role: "admin" },  // Include user ID and role
    process.env.JWT_SECRET,  // Ensure you have a secret key in .env
    { expiresIn: "7d" }  // Token expiry time
  );

  res.json({ message: "Login successful", token });
});

// router.get("/preview-blog/:slug", async (req, res) => {
//   try {
//     const blog = await Blog.findOne({ slug: req.params.slug });
//     if (!blog) {
//       return res.status(404).json({ message: "Blog not found" });
//     }
//     res.json(blog);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// });
//  Check if user is an admin
router.get("/check", authMiddleware, adminMiddleware, (req, res) => {
  res.status(200).json({ isAdmin: true, message: "Admin access granted" });
});

router.get("/preview-blog/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    console.log("Requested Slug:", slug); // Debugging

    const blog = await Blog.findOne({ slug });

    if (!blog) {
      console.log("Blog not found in DB");
      return res.status(404).json({ message: "Blog not found" });
    }

    console.log("Blog Found:", blog);
    res.json(blog);
  } catch (error) {
    console.error("Error fetching blog:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
module.exports = router;
