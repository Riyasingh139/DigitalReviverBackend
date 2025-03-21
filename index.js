require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const adminRoutes = require("./routes/adminRoutes");
const popupRoutes = require("./routes/popupRoutes");
const blogRoutes = require("./routes/blogRoutes");
const serviceRoutes = require("./routes/serviceRoutes")

const app = express();
const PORT = process.env.PORT || 8000;

const fs = require("fs");
const path = require("path");

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}


// Middleware
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads")); // Serve images statically


// Connect to MongoDB
connectDB();

// Routes
app.use("/admin", adminRoutes);
app.use("/popup", popupRoutes);
app.use("/api/blogs",blogRoutes)
app.use("/api/services",serviceRoutes)

// Start Server
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
