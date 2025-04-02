require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const adminRoutes = require("./routes/adminRoutes");
const popupRoutes = require("./routes/popupRoutes");
const blogRoutes = require("./routes/blogRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
// const authRoutes = require("./routes/authRoutes");
const previewBlog = require("./routes/previewBlogs")
const previewServices = require("./routes/previewServices")
const fs = require("fs");
const path = require("path");
// const PreviewBlog = require("./models/PreviewBlog");

const app = express();
const PORT = process.env.PORT || 8000;

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:3000", // Local development
  "https://digitalreviver.com", // Live website
  "https://www.digitalreviver.com", // Live 'www' version
];

// CORS Middleware (Applied Only Once)
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow cookies/token headers
  })
);



// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({limit: "50mb", extended: true }));
app.use("/uploads", express.static("uploads")); // Serve images statically

// Connect to MongoDB
connectDB();

// Routes
app.use("/admin", adminRoutes);
app.use("/popup", popupRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/preview-blogs", previewBlog);
app.use("/api/preview-services", previewServices);

// Start Server
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
