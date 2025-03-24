const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log("Auth Header:", authHeader); // Debugging

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }
   
  const token = authHeader.split(" ")[1];
  console.log("Extracted Token:", token); // Debugging


  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded); // Debugging
    req.user = decoded; // Attach user info to request
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);

    return res.status(403).json({ error: "Invalid token" });
  }
};

const adminMiddleware = (req, res, next) => {
  console.log("User Data:", req.user); // Debugging

  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access only" });
  }
  next();
};

// Verify Admin Middleware (For flexibility in checking admin role)
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || decoded.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin access only" });
    }

    req.admin = decoded; // Attach admin info to request
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

module.exports = { authMiddleware, adminMiddleware, verifyAdmin };
