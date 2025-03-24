require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const adminRoutes = require("./routes/adminRoutes");
const popupRoutes = require("./routes/popupRoutes");
const blogRoutes = require("./routes/blogRoutes");
const serviceRoutes = require("./routes/serviceRoutes")
const authRoutes = require("./routes/authRoutes");

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
app.use(express.urlencoded({ extended: true }));


// Connect to MongoDB
connectDB();

// Routes
// app.use("/api", require("./routes/apiRoutes")); 

app.use("/admin", adminRoutes);
app.use("/popup", popupRoutes);
app.use("/api/blogs",blogRoutes)
app.use("/api/services",serviceRoutes)
app.use("/api/auth", authRoutes);


// // Serve static files from React build
// app.use(express.static(path.join(__dirname, "client", "build")));

// // Catch-all route to serve `index.html`
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "client", "build", "index.html"));
// });

// Start Server
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
