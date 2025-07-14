require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet"); // <-- added
const connectDB = require("./config/db");
const adminRoutes = require("./routes/adminRoutes");
const popupRoutes = require("./routes/popupRoutes");
const blogRoutes = require("./routes/blogRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const previewBlog = require("./routes/previewBlogs");
const previewServices = require("./routes/previewServices");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8000;

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// CORS (allow all OR restrict as needed)
app.use(cors());

// Security Headers (Helmet)
app.use(helmet());

// Add missing headers manually (not all are covered by default helmet config)
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "img-src": ["'self'", "data:", "https:"],
      "script-src": ["'self'", "'unsafe-inline'", "https:"],
    },
  })
);

app.use(
  helmet.referrerPolicy({
    policy: "no-referrer-when-downgrade",
  })
);

// Custom headers to fix security report
app.use((req, res, next) => {
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  next();
});

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
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
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
