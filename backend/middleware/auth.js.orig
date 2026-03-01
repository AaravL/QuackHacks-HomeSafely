const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "No token provided" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT_SECRET not set in environment" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (handy for routes)
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
};

module.exports = {
  authMiddleware,
  errorHandler,
};