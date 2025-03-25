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
const corsOptions = {
  origin: "http://localhost:3000", // Update with your frontend domain in production
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true, // Allows cookies and auth headers
};

// Middleware
app.use(express.json());
// app.use(cors());
app.use(cors(corsOptions)); // Apply CORS once
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



const allowedOrigins = [
  "http://localhost:3000", // Local development
  "https://digitalreviver.com", // Live website
  "https://www.digitalreviver.com", // Live 'www' version
];

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
// app.use(cors({ origin: "*" }));

// // Serve static files from React build
// app.use(express.static(path.join(__dirname, "client", "build")));

// // Catch-all route to serve `index.html`
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "client", "build", "index.html"));
// });

// Start Server
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
