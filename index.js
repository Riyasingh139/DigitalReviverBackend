require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const moment = require("moment-timezone");


const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_CONN, {
   
    useUnifiedTopology: true,
  })
  .then(() => console.log(" Connected to MongoDB..."))
  .catch((err) => {
    console.error(" Could not connect to MongoDB:", err);
    process.exit(1);
  });

// **Popup Schema**
const popupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: {
    type: Date,
    default: () => moment().tz("Asia/Kolkata").toDate(), // Set your preferred timezone
  },
});

const Popup = mongoose.model("Popup", popupSchema);

// **Admin Schema**
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const Admin = mongoose.model("Admin", adminSchema);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL, // Your Gmail address
    pass: process.env.EMAIL_PASS, // App password (not your actual Gmail password)
  },
});

// **Middleware to verify admin (JWT)**
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

// **Admin Registration (Run only once)**
app.post("/admin/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin)
      return res.status(400).json({ error: "Admin already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ username, password: hashedPassword });
    await newAdmin.save();

    res.status(201).json({ message: "Admin registered successfully!" });
  } catch (error) {
    res.status(500).json({ error: " Error registering admin" });
  }
});

// **Admin Login**
app.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    res.status(200).json({ message: " Login successful", token });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// **Fetch all popup submissions (Admin Only)**
app.get("/admin/popups", verifyAdmin, async (req, res) => {
  try {
    const popups = await Popup.find().sort({ createdAt: -1 });
    res.status(200).json(popups);
  } catch (error) {
    console.error(" Error fetching popups:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// **Delete a popup message (Admin Only)**
app.delete("/admin/popup/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Popup.findByIdAndDelete(id);
    res.status(200).json({ message: " Popup deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: " Error deleting popup" });
  }
});

// **API route for submitting popup form**
app.post("/popup", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !phone || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newPopup = new Popup({ name, email, phone, message , });
    await newPopup.save();

    const submittedTimeIST = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
    const mailOptions = {
      from: process.env.EMAIL,
      to: process.env.EMAIL, // Your Gmail (where you receive submissions)
      subject: "New Popup Form Submission",
      text: `You have a new form submission:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}\n Submitted At: ${submittedTimeIST} (IST)`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: "Message Sent Successfully" });
  } catch (err) {
    console.error("Error saving data or sending email:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// **Start the server**
app.listen(PORT, () => {
  console.log(` Server is running on port ${PORT}`);
});
