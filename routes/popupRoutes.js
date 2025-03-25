const express = require("express");
const moment = require("moment-timezone");
const Popup = require("../models/Popup");
const { verifyAdmin } = require("../middleware/authMiddleware");
const transporter = require("../config/mailer");

const router = express.Router();

// Submit Popup Form
router.post("/", async (req, res) => {
  console.log("Received POST request on /admin/popups"); // Debugging
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !phone || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newPopup = new Popup({ name, email, phone, message });
    await newPopup.save();

    const submittedTimeIST = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
    const mailOptions = {
      from: process.env.EMAIL,
      to: process.env.EMAIL,
      subject: "New Popup Form Submission",
      text: `New submission:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}\nSubmitted At: ${submittedTimeIST} (IST)`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: "Message Sent Successfully" });
  } catch (err) {
    console.error("Error saving data or sending email:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get All Popups (Admin Only)
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const popups = await Popup.find().sort({ createdAt: -1 });
    res.status(200).json(popups);
  } catch (error) {
    console.error("Error fetching popups:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete Popup (Admin Only)
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Popup.findByIdAndDelete(id);
    res.status(200).json({ message: "Popup deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting popup" });
  }
});

module.exports = router;
